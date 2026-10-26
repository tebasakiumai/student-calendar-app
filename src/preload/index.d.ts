import { ElectronAPI } from '@electron-toolkit/preload'

interface Api {
  loadData: () => Promise<unknown>
  saveData: (data: unknown) => Promise<void>
  checkForUpdate: () => Promise<unknown>
  downloadUpdate: () => Promise<unknown>
  installUpdate: () => Promise<void>
  getAppVersion: () => Promise<string>
  onUpdateStatus: (callback: (status: unknown) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}