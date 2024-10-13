import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  net,
  Menu,
  Tray,
  desktopCapturer,
  nativeImage,
  webContents
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is, platform } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import creatWorker from './worker?nodeWorker'
import callFork from './fork'
import { IpcEvents } from '../shared/ipc-events'
import log from 'electron-log'
import pkg from 'node-machine-id';
import si from 'systeminformation'
import fs from 'fs'
import * as os from 'os'
import macMenuModule from './modules/macMenu'
import titleBarActionsModule from './modules/titleBarActions'
import updaterModule from './modules/updater'
import singleInstance from './singleInstance'
import { execute, runMigrate } from './db'

const modules = [titleBarActionsModule, macMenuModule, updaterModule]

const { machineIdSync } = pkg;
const deviceId = machineIdSync()
console.log('设备id :' + deviceId)
// 创建日志目录（如果不存在）
if (is.dev) {
  const logDir = join(__dirname, 'logs')
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
  }
}

// error, warn, info, verbose, debug, silly
log.transports.file.level = 'silly'
log.transports.file.resolvePathFn = () =>
  is.dev ? './logs/main.log' : join(app.getPath('userData'), 'logs/main.log')

function logToFile(message: string, clean = false) {
  const logFilePath = is.dev ? './logs/xmpp.log' : join(app.getPath('userData'), 'logs/xmpp.log')

  const timestamp = new Date().toISOString()
  const logMessage = `${timestamp} - ${message}\n`
  if (!clean) {
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) throw err
    })
  } else {
    fs.writeFile(logFilePath, '', (err) => {
      if (err) throw err
      console.log('Log file has been cleared!')
    })
  }
}

let mainWin
//打开主窗体
function createmainWin(): void {
  mainWin = new BrowserWindow({
    width: 900,
    height: 670,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 10, y: 10 },
    frame: false,
    transparent: true,
    titleBarOverlay: platform.isMacOS && { height: 32 },
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWin.on('ready-to-show', () => {
    mainWin.show()
  })

  mainWin.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWin.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWin.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'home' })
  }

  // Lock app to single instance
  if (singleInstance(app, mainWin)) return

  // 主窗口加载完成后打开开发者工具在新窗口
  mainWin.webContents.on('did-finish-load', () => {
    mainWin.webContents.openDevTools({ mode: 'detach' })
  })

  mainWin.on('closed', () => {
    mainWin = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let tray: Tray
app.whenReady().then(async () => {
  if (is.dev) {
    // 注册 F12 快捷键
    globalShortcut.register('F12', () => {
      const win = BrowserWindow.getFocusedWindow()
      if (win) {
        win.webContents.toggleDevTools()
      }
    })
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

 await runMigrate()

  //清空xmpp日志
  logToFile('', true)
  //系统托盘
  const icon = nativeImage.createFromPath('~/assets/img/loading.png')
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开',
      // icon: '/assets/img/loading.png',
      click: () => {
        mainWin!.webContents.send('playMusic')
      }
    },
    // 换行线
    {
      type: 'separator'
    },
    {
      label: '退出',
      // icon: '~/assets/img/loading.png',
      role: 'quit'
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('Miguu')
  tray.on('click', () => {
    mainWin!.show()
  })
  // 设置鼠标右键键事件
  tray.on('right-click', () => {
    tray.popUpContextMenu(contextMenu)
  })

  createmainWin()

  modules.forEach((module) => {
    try {
      module(mainWin!)
    } catch (err: any) {
      console.log('[!] Module error: ', err.message || err)
    }
  })

  //创建子进程
  creatWorker({ workerData: 'worker' })
    .on('message', (message) => {
      console.log(`\nMessage from worker: ${message}`)
    })
    .postMessage('')

  callFork()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createmainWin()
  })
})

app.on('will-quit', () => {
  // 取消注册所有快捷键
  globalShortcut.unregisterAll()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 渲染进程崩溃
app.on('render-process-gone', (event, webContents, details) => {
  log.error(
    `APP-ERROR:render-process-gone; event: ${JSON.stringify(event)}; webContents:${JSON.stringify(
      webContents
    )}; details:${JSON.stringify(details)}`
  )
})

// 渲染进程结束
app.on('render-process-gone', async (event, webContents, details) => {
  log.error(
    `APP-ERROR:render-process-gone; event: ${JSON.stringify(event)}; webContents:${JSON.stringify(
      webContents
    )}; details:${JSON.stringify(details)}`
  )
})

// 子进程结束
app.on('child-process-gone', async (event, details) => {
  log.error(
    `APP-ERROR:child-process-gone; event: ${JSON.stringify(event)}; details:${JSON.stringify(details)}`
  )
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error)
  app.quit()
})

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason)
  app.quit()
})

// IPC test
ipcMain.on(IpcEvents.EV_PING, () => console.log('pong'))

//调整窗口大小
ipcMain.on(IpcEvents.EV_CHANGE_WINDOWS_SIZE, (e, [size]) => {
  const { w, h, mw, mh, m, r, f } = size
  //当前窗口大小
  if (w && h) mainWin!.setSize(w, h)
  //最小窗口
  if (mw && mh) mainWin!.setMinimumSize(mw, mh)
  // 默认禁用最大化按钮
  mainWin!.setMaximizable(m == null ? false : m)
  //默认可调整窗口尺寸
  mainWin!.setResizable(r == null ? is.dev : r)
  //默认不可全屏
  mainWin!.setFullScreenable(f == null ? false : f)
})

// 新的xmpp消息
ipcMain.on(IpcEvents.EV_NEW_XMPP_MSG, (event, msg) => {
  console.log('新的xmpp消息：' + msg)
  logToFile(msg, false)
})

//打开独立聊天窗口
function createWin(
  title: string,
  urlPath: string,
  width: number = 800,
  height: number = 488,
  resize: boolean = false,
  maxium: boolean = false,
  fullscreen: boolean = false
) {
  let win = new BrowserWindow({
    width,
    height,
    backgroundColor: '#000',
    resizable: resize,
    maximizable: maxium,
    fullscreenable: fullscreen,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      devTools: is.dev
    },

    titleBarStyle: 'hiddenInset',
    // frame: platform === 'darwin',
    frame: false,
    transparent: true,
    titleBarOverlay: platform.isMacOS && { height: 32 },
    title: title
  })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWin.loadURL(process.env['ELECTRON_RENDERER_URL'] + urlPath)
    win.webContents.openDevTools({ mode: 'bottom' })
  } else {
    mainWin.loadFile(join(__dirname, `../renderer/index.html#${urlPath}`))
  }
}

//打开独立聊天窗口
ipcMain.on(IpcEvents.EV_OPEN_SEPARATE_DIALOGUE_WIN, (event: any, arg: any) => {
  createWin(arg + '', '/dialogue/separate_dialogue')
})
//打开全局搜索窗口
ipcMain.on(IpcEvents.EV_OPEN_SEARCH_GLOBAL_WIN, (event: any, arg: any) => {
  createWin('全局搜索', '/search/global_search')
})
//打开搜索用户窗口
ipcMain.on(IpcEvents.EV_OPEN_SEARCH_USER_WIN, (event: any, arg: any) => {
  createWin('查找用户/群', '/search/user_search')
})
//打开系统设置窗口
ipcMain.on(IpcEvents.EV_OPEN_SYS_SETTING_WIN, (event: any, arg: any) => {
  createWin('系统设置', '/setting/sys_setting')
})
//打开关于窗口
ipcMain.on(IpcEvents.EV_OPEN_ABOUT_WIN, (event: any, arg: any) => {
  createWin('关于', '/common/about', 640, 640)
})
//打开发现窗口
ipcMain.on(IpcEvents.EV_OPEN_DISCOVER_WIN, (event: any, arg: any) => {
  createWin('发现', '/discover', 640, 640)
})

// //存储当前登录用户
// ipcMain.handle(IpcEvents.EV_SET_CURRENT_USER, (event, user) => {
//   store.set(StoreKeys.user, user)
// })

// //获取当前登录用户
// ipcMain.handle(IpcEvents.EV_GET_CURRENT_USER, () => {
//   return store.get(StoreKeys.user)
// })

// 修复electron18.0.0-beta.5 之后版本的BUG: 无法获取当前程序页面视频流
const selfWindws = async () =>
  await Promise.all(
    webContents
      .getAllWebContents()
      .filter((item) => {
        const win = BrowserWindow.fromWebContents(item)
        return win && win.isVisible()
      })
      .map(async (item) => {
        const win = BrowserWindow.fromWebContents(item)
        const thumbnail = await win?.capturePage()
        // 当程序窗口打开DevTool的时候  也会计入
        return {
          name: win?.getTitle() + (item.devToolsWebContents === null ? '' : '-dev'), // 给dev窗口加上后缀
          id: win?.getMediaSourceId(),
          thumbnail,
          display_id: '',
          appIcon: null
        }
      })
  )

// 获取设备窗口信息
// ipcMain.handle(
//   IpcEvents.EV_SEND_DESKTOP_CAPTURER_SOURCE,
//   async (_event, _args) => {
//     return [
//       ...(await desktopCapturer.getSources({ types: ["window", "screen"] })),
//       ...(await selfWindws()),
//     ];
//   }
// );

ipcMain.handle(IpcEvents.EV_SEND_DESKTOP_CAPTURER_SOURCE, async (_event: any, _args: any) => {
  // 获取所有屏幕的源
  const sources = await desktopCapturer.getSources({ types: ['screen'] })

  // 过滤出表示整个电脑屏幕的源（如果有多个屏幕，可能需要进一步选择或者配置）
  // 这里假设你想要第一个屏幕，通常是主屏
  const screenSource = sources[0]

  // 确保找到了屏幕源
  if (!screenSource) {
    throw new Error('Screen source not found.')
  }

  // 返回屏幕源
  return sources
})

ipcMain.handle(IpcEvents.EV_DEVICE_INFO, async (_event: any, _args: any) => {
  const info = await si.osInfo()
  return {
    id: deviceId,
    info: info,
    platform: info.distro,
    name: os.hostname(),
    sysVer: info.release,
    clientVer: app.getVersion()
  }
})

//监测网络连接状态
function checkInternet(cb: (isConnected: boolean) => void) {
  const request = net.request({
    method: 'HEAD',
    protocol: 'http:',
    hostname: 'www.baidu.com'
  })

  request.on('response', (response) => {
    // 网络正常
    cb(response.statusCode === 200)
  })

  request.on('error', (error) => {
    // 网络异常
    console.error(`网络检测出错: ${error}`)
    cb(false)
  })

  request.end()
}
// 监听来自渲染进程的请求
ipcMain.on('check-internet', (event) => {
  checkInternet((isConnected) => {
    event.reply('internet-status', isConnected)
  })
})

// 包装函数，使 execute 符合 ipcMain.handle 的签名要求
ipcMain.handle('db:execute', execute)
