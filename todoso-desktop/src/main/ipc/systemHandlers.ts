import { ipcMain, app } from 'electron'
import { platform } from 'os'
import { IPC_CHANNELS } from '../../shared/ipc'

export function registerSystemHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SYSTEM_PLATFORM, () => {
    return platform()
  })

  ipcMain.handle(IPC_CHANNELS.SYSTEM_AUTO_LAUNCH, (_event, enabled: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true
    })
  })

  // We handle privilege escalation inline or outside, but this gives a hook if needed.
  ipcMain.handle(IPC_CHANNELS.SYSTEM_REQUEST_ADMIN, async () => {
    // Basic stub, actual escalation for hosts is handled by sudo-prompt or inline scripts
    return { granted: true }
  })
}
