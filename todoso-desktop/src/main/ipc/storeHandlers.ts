import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import type Store from 'electron-store'
import type { AppPreferences } from '../../shared/ipc'

export function registerStoreHandlers(store: Store<AppPreferences>): void {
  ipcMain.handle(IPC_CHANNELS.STORE_GET, (_event, { key, defaultValue }) => {
    if (key === '__all__') {
      return store.store
    }
    return store.get(key, defaultValue)
  })

  ipcMain.handle(IPC_CHANNELS.STORE_SET, (_event, { key, value }) => {
    store.set(key, value)
  })

  ipcMain.handle(IPC_CHANNELS.STORE_DELETE, (_event, { key }) => {
    store.delete(key)
  })
}
