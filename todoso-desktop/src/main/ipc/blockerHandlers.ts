import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import type { BlockerActivatePayload, BlockerStatusResult } from '../../shared/ipc'
import type { IBlocker } from '../services/blocker/IBlocker'

export function registerBlockerHandlers(blocker: IBlocker): void {
  ipcMain.handle(IPC_CHANNELS.BLOCKER_ACTIVATE, async (_event, payload: BlockerActivatePayload) => {
    try {
      await blocker.activate(payload.domains, payload.sessionId)
      return { success: true }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('[IPC] Blocker activate failed:', msg)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle(IPC_CHANNELS.BLOCKER_DEACTIVATE, async () => {
    try {
      await blocker.deactivate()
      return { success: true }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('[IPC] Blocker deactivate failed:', msg)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle(IPC_CHANNELS.BLOCKER_STATUS, (): BlockerStatusResult => {
    return {
      isActive: blocker.isActive(),
      blockedDomains: blocker.getBlockedDomains(),
      sessionId: blocker.getSessionId()
    }
  })

  ipcMain.handle(IPC_CHANNELS.BLOCKER_CLEANUP, async () => {
    await blocker.removeOrphanedEntries()
  })
}
