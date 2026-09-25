import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import type { KioskService } from '../services/kiosk/KioskService'

export function registerKioskHandlers(kioskService: KioskService, getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.KIOSK_ENTER, () => {
    const win = getMainWindow()
    if (win) {
      kioskService.enterKiosk(win)
    }
  })

  ipcMain.handle(IPC_CHANNELS.KIOSK_EXIT, () => {
    const win = getMainWindow()
    if (win) {
      kioskService.exitKiosk(win)
    }
  })

  ipcMain.handle(IPC_CHANNELS.KIOSK_STATUS, () => {
    return { isActive: kioskService.isKioskActive() }
  })
}
