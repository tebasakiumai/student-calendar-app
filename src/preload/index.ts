// Custom APIs for renderer
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data: unknown) => ipcRenderer.invoke('save-data', data),
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateStatus: (callback: (status: unknown) => void) => {
    const listener = (_event: unknown, status: unknown): void => callback(status)
    ipcRenderer.on('update-status', listener)
    return () => ipcRenderer.removeListener('update-status', listener)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
