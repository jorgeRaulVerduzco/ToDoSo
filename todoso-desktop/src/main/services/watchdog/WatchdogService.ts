/**
 * WatchdogService — failsafe that monitors process health.
 *
 * If the main process dies unexpectedly, the watchdog ensures the
 * hosts file is reverted. It also periodically checks for consistency.
 */

import type { IBlocker } from '../blocker/IBlocker'

export class WatchdogService {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private readonly blocker: IBlocker

  constructor(blocker: IBlocker) {
    this.blocker = blocker
  }

  start(): void {
    // Periodic check every 30 seconds
    this.intervalId = setInterval(async () => {
      await this.healthCheck()
    }, 30_000)

    // Register process exit handlers
    process.on('SIGINT', () => this.emergencyCleanup())
    process.on('SIGTERM', () => this.emergencyCleanup())
    process.on('SIGHUP', () => this.emergencyCleanup())

    console.log('[Watchdog] Started — monitoring process health')
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    console.log('[Watchdog] Stopped')
  }

  private async healthCheck(): Promise<void> {
    // If blocker thinks it's active but there's no session,
    // something went wrong — deactivate
    if (this.blocker.isActive() && this.blocker.getSessionId() === null) {
      console.warn('[Watchdog] Blocker active without session — deactivating')
      await this.blocker.deactivate()
    }
  }

  private async emergencyCleanup(): Promise<void> {
    console.log('[Watchdog] Emergency cleanup triggered')
    try {
      if (this.blocker.isActive()) {
        await this.blocker.deactivate()
        console.log('[Watchdog] Blocker deactivated in emergency cleanup')
      }
    } catch (err) {
      console.error('[Watchdog] Emergency cleanup failed:', err)
    }
    process.exit(0)
  }
}
