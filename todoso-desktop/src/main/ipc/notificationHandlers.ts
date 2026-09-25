import { ipcMain, Notification } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import type { NotificationPayload } from '../../shared/ipc'

export function registerNotificationHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.NOTIFY_SEND, (_event, payload: NotificationPayload) => {
    if (Notification.isSupported()) {
      new Notification({
        title: payload.title,
        body: payload.body,
        urgency: payload.urgency || 'normal'
      }).show()
    }
  })
}
