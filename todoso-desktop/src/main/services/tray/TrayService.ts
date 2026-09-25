/**
 * TrayService — system tray icon with context menu.
 *
 * Features:
 *   - Shows session timer in tooltip
 *   - Context menu: Open, Pause, Stop, Quit
 *   - Different icons for idle vs in-session
 */

import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { TrayTimerUpdate, TrayStateUpdate } from '../../../shared/ipc'

export class TrayService {
  private tray: Tray | null = null
  private mainWindow: BrowserWindow
  private currentState: 'idle' | 'in-session' | 'break' = 'idle'
  private remainingSeconds: number | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.create()
  }

  private create(): void {
    // Create a simple tray icon (16x16 square)
    const icon = nativeImage.createEmpty()
    this.tray = new Tray(icon.isEmpty() ? this.createDefaultIcon() : icon)

    this.tray.setToolTip('toDoSo — Ready')
    this.updateContextMenu()

    this.tray.on('click', () => {
      this.mainWindow.show()
      this.mainWindow.focus()
    })
  }

  private createDefaultIcon(): Electron.NativeImage {
    // Create a simple colored icon programmatically
    const size = 16
    const canvas = Buffer.alloc(size * size * 4)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4
        // Purple gradient circle
        const cx = x - size / 2
        const cy = y - size / 2
        const dist = Math.sqrt(cx * cx + cy * cy)
        if (dist < size / 2 - 1) {
          canvas[idx] = 139     // R
          canvas[idx + 1] = 92  // G
          canvas[idx + 2] = 246 // B — purple
          canvas[idx + 3] = 255 // A
        } else {
          canvas[idx + 3] = 0   // Transparent
        }
      }
    }

    return nativeImage.createFromBuffer(canvas, { width: size, height: size })
  }

  updateTimer(update: TrayTimerUpdate): void {
    this.remainingSeconds = update.remainingSeconds

    if (update.isActive && update.remainingSeconds !== null) {
      const mins = Math.floor(update.remainingSeconds / 60)
      const secs = update.remainingSeconds % 60
      const timeStr = `${mins}:${String(secs).padStart(2, '0')}`
      this.tray?.setToolTip(`toDoSo — ${timeStr} remaining`)
    } else if (update.isActive) {
      this.tray?.setToolTip('toDoSo — Focus session active')
    } else {
      this.tray?.setToolTip('toDoSo — Ready')
    }
  }

  updateState(update: TrayStateUpdate): void {
    this.currentState = update.state
    this.updateContextMenu()
  }

  private updateContextMenu(): void {
    const isInSession = this.currentState === 'in-session'

    const menu = Menu.buildFromTemplate([
      {
        label: 'Open toDoSo',
        click: () => {
          this.mainWindow.show()
          this.mainWindow.focus()
        }
      },
      { type: 'separator' },
      ...(isInSession
        ? [
            {
              label: 'Stop Session',
              click: () => {
                this.mainWindow.webContents.send(IPC_CHANNELS.TRAY_ACTION, 'stop')
                this.mainWindow.show()
              }
            }
          ]
        : []),
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true
          app.quit()
        }
      }
    ])

    this.tray?.setContextMenu(menu)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }
}
