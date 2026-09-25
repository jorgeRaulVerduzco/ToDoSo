import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'

export function registerWindowHandlers(
  getMainWindow: () => BrowserWindow | null,
  getPetWindow: () => BrowserWindow | null,
  setPetWindow: (win: BrowserWindow | null) => void,
  createPetWindow: () => BrowserWindow
): void {
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    const win = getMainWindow()
    if (win) win.minimize()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const win = getMainWindow()
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    const win = getMainWindow()
    if (win) win.close()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_PET_TOGGLE, () => {
    const win = getPetWindow()
    if (win) {
      win.close()
      setPetWindow(null)
    } else {
      setPetWindow(createPetWindow())
    }
  })
}
