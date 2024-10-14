import { BrowserWindow, ipcMain, net } from 'electron'
import log from 'electron-log'
import pkg from 'electron-updater'
const { autoUpdater } = pkg

// Logger
// ======
autoUpdater.logger = log
;(autoUpdater.logger as typeof log).transports.file.level = 'info'

// Config
// ======
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

// // 设置更新服务器配置
// autoUpdater.setFeedURL({
//   provider: 'generic',
//   url: 'https://example.com/auto-updates',
//   updaterCacheDirName: 'zhiliao-desktop-electron-updater'
// })

// Module
// ======
export default (mainWindow: BrowserWindow) => {
  log.info('Starting auto updater')

  const isMac = process.platform === 'darwin'
  if (isMac) {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
  }

  // Helpers
  // =======
  let readyToInstall = false
  let updateCheckInterval = 1000 * 60 * 60 * 2 // 2 hours
  let lastUpdateCheck = 0
  let retryCount = 0
  const MAX_RETRIES = 3

  function sendUpdaterStatus(...args: any[]) {
    mainWindow.webContents.send('updater:statusChanged', args)
  }


  async function safeCheckForUpdates() {
    if (net.isOnline()) {
      try {
        await autoUpdater.checkForUpdates()
      } catch (error) {
        log.error('Error checking for updates:', error)
        throw error // 抛出错误以触发重试机制
      }
    } else {
      log.info('Skipping update check - no internet connection')
    }
  }

  async function checkForUpdatesWithRetry() {
    try {
      await safeCheckForUpdates()
      retryCount = 0 // 重置重试计数
    } catch (error) {
      log.error('Error checking for updates:', error)
      if (retryCount < MAX_RETRIES) {
        retryCount++
        log.info(`Retrying update check (${retryCount}/${MAX_RETRIES})`)
        setTimeout(checkForUpdatesWithRetry, 60000 * retryCount) // 每次重试间隔增加
      } else {
        log.warn('Max retries reached for update check')
        retryCount = 0 // 重置重试计数
      }
    }
  }

  function checkForUpdates() {
    const now = Date.now()
    if (now - lastUpdateCheck > updateCheckInterval) {
      checkForUpdatesWithRetry()
      lastUpdateCheck = now
    }
  }

  // Event Listeners
  // ===============
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
    sendUpdaterStatus('check-for-update')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info)
    sendUpdaterStatus('update-available', info)
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info)
    sendUpdaterStatus('update-not-available', info)
  })

  autoUpdater.on('error', (err) => {
    log.error('Update error:', err)
    sendUpdaterStatus('update-error', err.message)
  })

  autoUpdater.on('download-progress', (progress) => {
    log.info('Download progress:', progress)
    sendUpdaterStatus('downloading', progress)
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info)
    sendUpdaterStatus('update-downloaded', info)
    mainWindow.webContents.send('updater:readyToInstall')
    readyToInstall = true
  })

  // IPC Listeners
  // =============
  ipcMain.handle('updater:check', async (_event) => {
    try {
      return await autoUpdater.checkForUpdates()
    } catch (error) {
      log.error('Error during manual update check:', error)
      return null
    }
  })

  ipcMain.handle('updater:quitAndInstall', (_event) => {
    if (!readyToInstall) {
      log.warn('Attempted to quit and install when update not ready')
      return false
    }
    try {
      autoUpdater.quitAndInstall()
      return true
    } catch (error) {
      log.error('Error during quit and install:', error)
      return false
    }
  })

  // Initial update check
  setTimeout(() => checkForUpdatesWithRetry(), 10000) // 启动 10 秒后检查

  // Periodic update checks
  setInterval(checkForUpdates, 15 * 60 * 1000) // 每 15 分钟检查一次
}