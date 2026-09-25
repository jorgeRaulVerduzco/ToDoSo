import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import type { TrayService } from '../services/tray/TrayService'
import type { TrayTimerUpdate, TrayStateUpdate } from '../../shared/ipc'

export function registerTrayHandlers(trayService: TrayService): void {
  ipcMain.handle(IPC_CHANNELS.TRAY_UPDATE_TIMER, (_event, update: TrayTimerUpdate) => {
    trayService.updateTimer(update)
  })

  ipcMain.handle(IPC_CHANNELS.TRAY_UPDATE_STATE, (_event, update: TrayStateUpdate) => {
    trayService.updateState(update)
  })
}
