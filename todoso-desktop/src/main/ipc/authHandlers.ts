import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc';
import { SecureTokenStore } from '../services/auth/secureTokenStore';

export function registerAuthHandlers(store: SecureTokenStore): void {
  ipcMain.handle(IPC_CHANNELS.AUTH_GET_REFRESH, () => {
    return store.getRefreshToken();
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_SET_REFRESH, (_event, { token, persist }: { token: string; persist: boolean }) => {
    store.setRefreshToken(token, persist);
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_CLEAR_REFRESH, () => {
    store.clearRefreshToken();
  });
}
