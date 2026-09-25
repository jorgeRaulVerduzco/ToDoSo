/**
 * Preload script — contextBridge API exposed to the renderer.
 *
 * Security: contextIsolation=true, nodeIntegration=false.
 * The renderer NEVER accesses Node directly — everything goes through
 * this typed bridge. Each method maps 1:1 to an IPC channel in shared/ipc.ts.
 */

import { contextBridge, ipcRenderer } from 'electron'
import type {
  BlockerActivatePayload,
  BlockerStatusResult,
  NotificationPayload,
  TrayTimerUpdate,
  TrayStateUpdate,
  TrayAction,
  AppPreferences
} from '../shared/ipc'
import { IPC_CHANNELS } from '../shared/ipc'

const electronAPI = {
  // ─── Blocker ──────────────────────────────────────────────
  blocker: {
    activate: (payload: BlockerActivatePayload): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.BLOCKER_ACTIVATE, payload),
    deactivate: (): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.BLOCKER_DEACTIVATE),
    getStatus: (): Promise<BlockerStatusResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.BLOCKER_STATUS),
    cleanup: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.BLOCKER_CLEANUP)
  },

  // ─── Kiosk ────────────────────────────────────────────────
  kiosk: {
    enter: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.KIOSK_ENTER),
    exit: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.KIOSK_EXIT),
    getStatus: (): Promise<{ isActive: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.KIOSK_STATUS)
  },

  // ─── Notifications ────────────────────────────────────────
  notify: {
    send: (payload: NotificationPayload): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.NOTIFY_SEND, payload)
  },

  // ─── Store (preferences) ──────────────────────────────────
  store: {
    get: <K extends keyof AppPreferences>(key: K, defaultValue?: AppPreferences[K]): Promise<AppPreferences[K]> =>
      ipcRenderer.invoke(IPC_CHANNELS.STORE_GET, { key, defaultValue }),
    set: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.STORE_SET, { key, value }),
    delete: (key: keyof AppPreferences): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.STORE_DELETE, { key }),
    getAll: (): Promise<AppPreferences> =>
      ipcRenderer.invoke(IPC_CHANNELS.STORE_GET, { key: '__all__' })
  },

  // ─── Tray ─────────────────────────────────────────────────
  tray: {
    updateTimer: (update: TrayTimerUpdate): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.TRAY_UPDATE_TIMER, update),
    updateState: (update: TrayStateUpdate): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.TRAY_UPDATE_STATE, update),
    onAction: (callback: (action: TrayAction) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, action: TrayAction): void => {
        callback(action)
      }
      ipcRenderer.on(IPC_CHANNELS.TRAY_ACTION, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TRAY_ACTION, handler)
    }
  },

  // ─── Window ───────────────────────────────────────────────
  window: {
    minimize: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
    close: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
    maximize: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
    togglePet: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_PET_TOGGLE)
  },

  // ─── System ───────────────────────────────────────────────
  system: {
    getPlatform: (): Promise<NodeJS.Platform> =>
      ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_PLATFORM),
    requestAdmin: (): Promise<{ granted: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_REQUEST_ADMIN),
    setAutoLaunch: (enabled: boolean): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_AUTO_LAUNCH, enabled)
  },

  // ─── Auth ─────────────────────────────────────────────────
  auth: {
    getRefreshToken: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_REFRESH),
    setRefreshToken: (token: string, persist: boolean): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTH_SET_REFRESH, { token, persist }),
    clearRefreshToken: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTH_CLEAR_REFRESH)
  },

  // ─── Session events (main → renderer) ─────────────────────
  onSessionEvent: (callback: (event: unknown) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown): void => {
      callback(data)
    }
    ipcRenderer.on(IPC_CHANNELS.SESSION_EVENT, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SESSION_EVENT, handler)
  }
}

export type ElectronAPI = typeof electronAPI

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
