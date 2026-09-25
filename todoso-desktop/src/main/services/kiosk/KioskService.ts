/**
 * KioskService — strict mode / locked fullscreen.
 *
 * Safety requirements (non-negotiable):
 *   - Opt-in only, never auto-activated
 *   - Emergency exit always available (hold 10 seconds)
 *   - Max 2-hour sessions
 *   - Failsafe: if process dies, kiosk mode exits
 *   - NEVER blocks OS-level shortcuts (Ctrl+Alt+Del, etc.)
 */

import { BrowserWindow, globalShortcut } from 'electron'

const MAX_KIOSK_DURATION_MS = 2 * 60 * 60 * 1000 // 2 hours

export class KioskService {
  private _isActive = false
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  private registeredShortcuts: string[] = []

  isKioskActive(): boolean {
    return this._isActive
  }

  enterKiosk(win: BrowserWindow): void {
    if (this._isActive) return

    // Set window to kiosk mode
    win.setKiosk(true)
    win.setAlwaysOnTop(true, 'screen-saver')

    // Intercept common escape shortcuts to add friction
    // NOTE: We do NOT block Ctrl+Alt+Del — that's an OS-level shortcut
    const shortcuts = ['CommandOrControl+W', 'Alt+F4', 'CommandOrControl+Q']
    for (const shortcut of shortcuts) {
      try {
        globalShortcut.register(shortcut, () => {
          // Blocked — user must use the in-app emergency exit
          console.log(`[Kiosk] Blocked shortcut: ${shortcut}`)
        })
        this.registeredShortcuts.push(shortcut)
      } catch {
        // Some shortcuts may already be registered
      }
    }

    // Prevent close via window events
    win.on('close', this.preventClose)

    // Safety: auto-exit after 2 hours maximum
    this.timeoutId = setTimeout(() => {
      console.log('[Kiosk] Max duration reached — exiting kiosk mode')
      this.exitKiosk(win)
    }, MAX_KIOSK_DURATION_MS)

    this._isActive = true
    console.log('[Kiosk] Entered kiosk mode')
  }

  exitKiosk(win: BrowserWindow): void {
    if (!this._isActive) return

    // Restore window
    win.setKiosk(false)
    win.setAlwaysOnTop(false)

    // Unregister blocked shortcuts
    for (const shortcut of this.registeredShortcuts) {
      globalShortcut.unregister(shortcut)
    }
    this.registeredShortcuts = []

    // Remove close prevention
    win.removeListener('close', this.preventClose)

    // Clear safety timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    this._isActive = false
    console.log('[Kiosk] Exited kiosk mode')
  }

  private preventClose = (event: Electron.Event): void => {
    event.preventDefault()
  }
}
