import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'

autoUpdater.logger = console

let mainWindow: BrowserWindow | null = null
function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 900,       // ← 追加
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()
  autoUpdater.on('error', (error) => {
    console.error('update error:', error)
  })
  autoUpdater.on('checking-for-update', () => {
    console.log('checking for update...')
  })
  autoUpdater.on('update-available', (info) => {
    console.log('update available:', info)
  })
  autoUpdater.on('update-not-available', (info) => {
    console.log('update not available:', info)
  })
  autoUpdater.checkForUpdatesAndNotify()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const store = new Store()

ipcMain.handle('load-data', () => {
  return store.get('appData', null)
})

ipcMain.handle('save-data', (_event, data) => {
  store.set('appData', data)
})

// ===== 自動更新 =====
autoUpdater.autoDownload = false // ユーザーが押すまでダウンロードしない
autoUpdater.logger = console

function sendUpdateStatus(status: unknown): void {
  mainWindow?.webContents.send('update-status', status)
}

autoUpdater.on('checking-for-update', () => {
  sendUpdateStatus({ state: 'checking' })
})
autoUpdater.on('update-available', (info) => {
  sendUpdateStatus({ state: 'available', version: info.version })
})
autoUpdater.on('update-not-available', () => {
  sendUpdateStatus({ state: 'not-available' })
})
autoUpdater.on('download-progress', (progress) => {
  sendUpdateStatus({ state: 'downloading', percent: Math.round(progress.percent) })
})
autoUpdater.on('update-downloaded', (info) => {
  sendUpdateStatus({ state: 'downloaded', version: info.version })
})
autoUpdater.on('error', (error) => {
  sendUpdateStatus({ state: 'error', message: error.message })
})

ipcMain.handle('check-for-update', () => {
  if (!app.isPackaged) {
    sendUpdateStatus({ state: 'dev-mode' })
    return
  }
  return autoUpdater.checkForUpdates()
})

ipcMain.handle('download-update', () => {
  return autoUpdater.downloadUpdate()
})

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall()
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})