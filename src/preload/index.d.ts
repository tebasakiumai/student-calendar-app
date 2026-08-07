import { ElectronAPI } from '@electron-toolkit/preload'

interface Api {
  loadData: () => Promise<unknown>
  saveData: (data: unknown) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}