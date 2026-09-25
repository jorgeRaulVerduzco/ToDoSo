/**
 * HostsBlocker — blocks sites by writing to the system hosts file.
 *
 * How it works:
 *   1. On activate: appends entries between delimited markers to the hosts file.
 *   2. On deactivate: removes ONLY the app's block between markers.
 *   3. Both domain.com and www.domain.com are blocked.
 *
 * Markers:
 *   # >>> toDoSo start [session:123]
 *   127.0.0.1 facebook.com
 *   127.0.0.1 www.facebook.com
 *   # <<< toDoSo end
 *
 * Platform paths:
 *   - Windows: C:\Windows\System32\drivers\etc\hosts
 *   - macOS/Linux: /etc/hosts
 *
 * Requires elevated permissions (admin/sudo).
 */

import { readFile, writeFile } from 'fs/promises'
import { platform } from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { IBlocker } from './IBlocker'

const execAsync = promisify(exec)

const MARKER_START_PREFIX = '# >>> toDoSo start'
const MARKER_END = '# <<< toDoSo end'

function getHostsPath(): string {
  return platform() === 'win32'
    ? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
    : '/etc/hosts'
}

export class HostsBlocker implements IBlocker {
  private _isActive = false
  private _blockedDomains: string[] = []
  private _sessionId: number | null = null

  async activate(domains: string[], sessionId: number): Promise<void> {
    const hostsPath = getHostsPath()

    // Build the block content
    const entries = domains.flatMap((domain) => {
      const clean = domain.toLowerCase().trim()
      const lines = [`127.0.0.1 ${clean}`]
      if (!clean.startsWith('www.')) {
        lines.push(`127.0.0.1 www.${clean}`)
      }
      return lines
    })

    const block = [
      `${MARKER_START_PREFIX} [session:${sessionId}]`,
      ...entries,
      MARKER_END,
      '' // trailing newline
    ].join('\n')

    // Read current hosts
    const currentContent = await readFile(hostsPath, 'utf-8')

    // Remove any existing toDoSo block first
    const cleaned = this.removeBlockFromContent(currentContent)

    // Append our block
    const newContent = cleaned.trimEnd() + '\n\n' + block

    // Write with elevated permissions
    await this.writeHostsElevated(hostsPath, newContent)

    // Flush DNS cache
    await this.flushDns()

    this._isActive = true
    this._blockedDomains = domains
    this._sessionId = sessionId
  }

  async deactivate(): Promise<void> {
    const hostsPath = getHostsPath()

    try {
      const currentContent = await readFile(hostsPath, 'utf-8')
      const cleaned = this.removeBlockFromContent(currentContent)

      if (cleaned !== currentContent) {
        await this.writeHostsElevated(hostsPath, cleaned)
        await this.flushDns()
      }
    } catch (err) {
      console.error('[HostsBlocker] Error during deactivation:', err)
    }

    this._isActive = false
    this._blockedDomains = []
    this._sessionId = null
  }

  isActive(): boolean {
    return this._isActive
  }

  getBlockedDomains(): string[] {
    return [...this._blockedDomains]
  }

  getSessionId(): number | null {
    return this._sessionId
  }

  async hasOrphanedEntries(): Promise<boolean> {
    const hostsPath = getHostsPath()
    try {
      const content = await readFile(hostsPath, 'utf-8')
      return content.includes(MARKER_START_PREFIX)
    } catch {
      return false
    }
  }

  async removeOrphanedEntries(): Promise<void> {
    const hostsPath = getHostsPath()
    try {
      const content = await readFile(hostsPath, 'utf-8')
      if (content.includes(MARKER_START_PREFIX)) {
        const cleaned = this.removeBlockFromContent(content)
        if (cleaned !== content) {
          await this.writeHostsElevated(hostsPath, cleaned)
          await this.flushDns()
          console.log('[HostsBlocker] Orphaned entries removed')
        }
      }
    } catch (err) {
      console.error('[HostsBlocker] Error removing orphaned entries:', err)
    }
  }

  // ─── Private helpers ────────────────────────────────────────

  private removeBlockFromContent(content: string): string {
    const lines = content.split('\n')
    const result: string[] = []
    let insideBlock = false

    for (const line of lines) {
      if (line.startsWith(MARKER_START_PREFIX)) {
        insideBlock = true
        continue
      }
      if (line.trim() === MARKER_END) {
        insideBlock = false
        continue
      }
      if (!insideBlock) {
        result.push(line)
      }
    }

    // Remove trailing blank lines that we added
    while (result.length > 0 && result[result.length - 1]!.trim() === '') {
      result.pop()
    }

    return result.join('\n') + '\n'
  }

  private async writeHostsElevated(hostsPath: string, content: string): Promise<void> {
    if (platform() === 'win32') {
      // On Windows, write directly — the app should be running elevated
      // or use PowerShell with elevated permissions
      try {
        await writeFile(hostsPath, content, 'utf-8')
      } catch {
        // If direct write fails, try PowerShell
        const escaped = content.replace(/'/g, "''").replace(/\r?\n/g, '`n')
        await execAsync(
          `powershell -Command "Start-Process powershell -ArgumentList '-Command', 'Set-Content -Path ''${hostsPath}'' -Value ''${escaped}''' -Verb RunAs -Wait"`
        )
      }
    } else {
      // macOS/Linux — use sudo
      const tmpPath = `/tmp/todoso-hosts-${Date.now()}`
      await writeFile(tmpPath, content, 'utf-8')
      await execAsync(`sudo cp "${tmpPath}" "${hostsPath}"`)
      await execAsync(`rm "${tmpPath}"`)
    }
  }

  private async flushDns(): Promise<void> {
    try {
      switch (platform()) {
        case 'win32':
          await execAsync('ipconfig /flushdns')
          break
        case 'darwin':
          await execAsync('sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder')
          break
        case 'linux':
          await execAsync('sudo systemd-resolve --flush-caches 2>/dev/null || sudo systemctl restart nscd 2>/dev/null || true')
          break
      }
    } catch (err) {
      console.warn('[HostsBlocker] DNS flush failed (non-critical):', err)
    }
  }
}
