/**
 * Main process entry — Electron bootstrap.
 *
 * Responsibilities:
 *   - Create the main BrowserWindow
 *   - Register all IPC handlers
 *   - Initialize system services (blocker, tray, watchdog)
 *   - Handle lifecycle events with failsafe cleanup
 */

import { app, BrowserWindow, ipcMain, Notification, globalShortcut } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { HostsBlocker } from './services/blocker/HostsBlocker'
import { cleanupOrphanedBlocks } from './services/blocker/cleanup'
import { TrayService } from './services/tray/TrayService'
import { KioskService } from './services/kiosk/KioskService'
import { WatchdogService } from './services/watchdog/WatchdogService'
import { registerBlockerHandlers } from './ipc/blockerHandlers'
import { registerKioskHandlers } from './ipc/kioskHandlers'
import { registerStoreHandlers } from './ipc/storeHandlers'
import { registerNotificationHandlers } from './ipc/notificationHandlers'
import { registerSystemHandlers } from './ipc/systemHandlers'
import { registerWindowHandlers } from './ipc/windowHandlers'
import { registerTrayHandlers } from './ipc/trayHandlers'
import { registerAuthHandlers } from './ipc/authHandlers'
import { SecureTokenStore } from './services/auth/secureTokenStore'
import type { AppPreferences } from '../shared/ipc'
import { DEFAULT_PREFERENCES } from '../shared/ipc'

// ─── Globals ─────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null
let petWindow: BrowserWindow | null = null
let trayService: TrayService | null = null
const blocker = new HostsBlocker()
const kioskService = new KioskService()
const watchdog = new WatchdogService(blocker)

// ─── Store (electron-store, lazy import for ESM compat) ──────────────

let storeInstance: import('electron-store').default<AppPreferences> | null = null

async function getStore(): Promise<import('electron-store').default<AppPreferences>> {
  if (!storeInstance) {
    const Store = (await import('electron-store')).default
    storeInstance = new Store<AppPreferences>({
      defaults: DEFAULT_PREFERENCES
    })
  }
  return storeInstance
}

// ─── Window creation ─────────────────────────────────────────────────

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0f',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false // needed for electron-store
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  // Prevent close — minimize to tray if enabled
  win.on('close', async (event) => {
    const store = await getStore()
    if (store.get('minimizeToTray') && !app.isQuitting) {
      event.preventDefault()
      win.hide()
    }
  })

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function createPetWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 120,
    height: 140,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Allow click-through except on the pet itself
  win.setIgnoreMouseEvents(true, { forward: true })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/pet-window`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/pet-window' })
  }

  return win
}

// ─── App lifecycle ───────────────────────────────────────────────────

// Extend app type to include our custom flag
declare module 'electron' {
  interface App {
    isQuitting?: boolean
  }
}

app.whenReady().then(async () => {
  // FAILSAFE: Clean orphaned blocks on startup
  try {
    await cleanupOrphanedBlocks(blocker)
    console.log('[Watchdog] Startup cleanup completed')
  } catch (err) {
    console.error('[Watchdog] Startup cleanup failed:', err)
  }

  // Create main window
  mainWindow = createMainWindow()

  // Initialize tray
  trayService = new TrayService(mainWindow)

  // Start watchdog
  watchdog.start()

  // Register all IPC handlers
  const store = await getStore()
  const secureTokenStore = new SecureTokenStore(app.getPath('userData'))
  registerBlockerHandlers(blocker)
  registerKioskHandlers(kioskService, () => mainWindow)
  registerStoreHandlers(store)
  registerNotificationHandlers()
  registerSystemHandlers()
  registerWindowHandlers(() => mainWindow, () => petWindow, (win) => { petWindow = win }, createPetWindow)
  registerTrayHandlers(trayService)
  registerAuthHandlers(secureTokenStore)

  // Dev tools in development
  if (is.dev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    } else {
      mainWindow?.show()
    }
  })
})

// ─── Graceful shutdown with failsafe cleanup ─────────────────────────

app.on('before-quit', async (event) => {
  app.isQuitting = true

  // Revert blocker
  try {
    if (blocker.isActive()) {
      event.preventDefault()
      await blocker.deactivate()
      console.log('[Failsafe] Blocker deactivated on quit')
      app.quit()
    }
  } catch (err) {
    console.error('[Failsafe] Error during quit cleanup:', err)
  }

  // Exit kiosk
  if (mainWindow && kioskService.isKioskActive()) {
    kioskService.exitKiosk(mainWindow)
  }

  // Stop watchdog
  watchdog.stop()

  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle uncaught errors — always revert the blocker
process.on('uncaughtException', async (error) => {
  console.error('[CRITICAL] Uncaught exception:', error)
  try {
    await blocker.deactivate()
  } catch {
    // Best effort
  }
  app.quit()
})

process.on('unhandledRejection', async (reason) => {
  console.error('[CRITICAL] Unhandled rejection:', reason)
})
