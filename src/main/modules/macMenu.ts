import { app, BrowserWindow, Menu } from 'electron'

// Helpers
// =======
const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = []

// Module
// ======
export default (mainWindow: BrowserWindow) => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  if (process.platform === 'darwin') {
    // OS X
    const name = '知了IM电脑版'
    template.unshift({
      label: name,
      submenu: [
        {
          label: 'About ' + name,
          role: 'about'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click() {
            app.quit()
          }
        },
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click() {
            // Reload the current window
            if (mainWindow) {
              mainWindow.reload()
            }
          }
        },
        ...(isDevelopment
          ? [
              {
                label: '开发者工具',
                accelerator: 'Alt+Command+I',
                click() {
                  if (mainWindow) {
                    mainWindow.webContents.toggleDevTools()
                  }
                }
              }
            ]
          : [])
      ]
    })

    template.push({
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '删除', role: 'delete' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        { type: 'separator' },
        { label: '搜索', accelerator: 'CmdOrCtrl+F' },
      ]
    });

    // Add 'Window' menu for window operations
    template.push({
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '缩放', role: 'zoom' },
        { type: 'separator' },
        { label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close' },
        { label: '前置所有窗口', role: 'front' },
        { label: '切换全屏', accelerator: 'Ctrl+Cmd+F', role: 'togglefullscreen' },
      ]
    });

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}
