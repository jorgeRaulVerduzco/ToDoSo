/**
 * Shared IPC channel contracts — the single source of truth for
 * typed communication between main ↔ preload ↔ renderer.
 *
 * Every IPC call goes through one of these channels. No magic strings.
 */

// ─── Domain Types (mirrors Django entities) ───────────────────────────

export type TaskStatus = 'pending' | 'completed'
export type Priority = 'low' | 'medium' | 'high'
export type SessionStatus = 'active' | 'finished' | 'cancelled'

export interface Task {
  id: number
  owner_id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  created_at: string
  due_date: string | null
}

export interface BlockedSite {
  id: number
  owner_id: number
  domain: string
  is_active: boolean
}

export interface FocusSession {
  id: number
  owner_id: number
  started_at: string
  planned_duration_minutes: number | null
  ended_at: string | null
  status: SessionStatus
  task_id: number | null
}

export interface FocusStateSnapshot {
  has_active_session: boolean
  session: FocusSession | null
  blocked_domains: string[]
}

export interface SessionStats {
  total_sessions: number
  completed_sessions: number
  cancelled_sessions: number
  total_focus_minutes: number
}

// ─── IPC Channel Names ───────────────────────────────────────────────

export const IPC_CHANNELS = {
  // Blocker
  BLOCKER_ACTIVATE: 'blocker:activate',
  BLOCKER_DEACTIVATE: 'blocker:deactivate',
  BLOCKER_STATUS: 'blocker:status',
  BLOCKER_CLEANUP: 'blocker:cleanup',

  // Kiosk
  KIOSK_ENTER: 'kiosk:enter',
  KIOSK_EXIT: 'kiosk:exit',
  KIOSK_STATUS: 'kiosk:status',

  // Tray
  TRAY_UPDATE_TIMER: 'tray:update-timer',
  TRAY_UPDATE_STATE: 'tray:update-state',

  // Notifications
  NOTIFY_SEND: 'notify:send',

  // Store (preferences)
  STORE_GET: 'store:get',
  STORE_SET: 'store:set',
  STORE_DELETE: 'store:delete',

  // Window management
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_PET_TOGGLE: 'window:pet-toggle',
  WINDOW_PET_SHOW: 'window:pet-show',
  WINDOW_PET_HIDE: 'window:pet-hide',

  // System
  SYSTEM_PLATFORM: 'system:platform',
  SYSTEM_REQUEST_ADMIN: 'system:request-admin',
  SYSTEM_AUTO_LAUNCH: 'system:auto-launch',

  // Events from main → renderer
  SESSION_EVENT: 'session:event',
  TRAY_ACTION: 'tray:action'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

// ─── IPC Payloads ────────────────────────────────────────────────────

export interface BlockerActivatePayload {
  domains: string[]
  sessionId: number
}

export interface BlockerStatusResult {
  isActive: boolean
  blockedDomains: string[]
  sessionId: number | null
}

export interface NotificationPayload {
  title: string
  body: string
  urgency?: 'low' | 'normal' | 'critical'
}

export interface StoreGetPayload {
  key: string
  defaultValue?: unknown
}

export interface TrayTimerUpdate {
  remainingSeconds: number | null
  totalSeconds: number | null
  isActive: boolean
}

export interface TrayStateUpdate {
  state: 'idle' | 'in-session' | 'break'
  sessionId?: number
}

export type TrayAction = 'open' | 'pause' | 'stop' | 'quit'

export type PetState = 'sleeping' | 'focused' | 'celebrating' | 'encouraging' | 'idle'

// ─── Preferences Schema ──────────────────────────────────────────────

export interface AppPreferences {
  theme: 'light' | 'dark' | 'system'
  autoLaunch: boolean
  minimizeToTray: boolean
  petEnabled: boolean
  petFloatingWindow: boolean
  petCharacter: string
  defaultSessionMinutes: number
  soundEnabled: boolean
  notificationsEnabled: boolean
  onboardingCompleted: boolean
  focusMinutesTotal: number
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'system',
  autoLaunch: false,
  minimizeToTray: true,
  petEnabled: true,
  petFloatingWindow: false,
  petCharacter: 'blob',
  defaultSessionMinutes: 25,
  soundEnabled: true,
  notificationsEnabled: true,
  onboardingCompleted: false,
  focusMinutesTotal: 0
}
