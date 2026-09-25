/**
 * IBlocker — interface for site blocking strategies.
 *
 * Design: Program against this interface, never against HostsBlocker directly.
 * This allows swapping to a proxy/DNS-based blocker without touching any
 * consumer code (Dependency Inversion Principle).
 */

export interface IBlocker {
  /**
   * Activate blocking for the given domains.
   * Each domain will be blocked along with its www. variant.
   */
  activate(domains: string[], sessionId: number): Promise<void>

  /**
   * Deactivate blocking — remove only entries created by this app.
   */
  deactivate(): Promise<void>

  /**
   * Check if blocking is currently active.
   */
  isActive(): boolean

  /**
   * Get the list of currently blocked domains.
   */
  getBlockedDomains(): string[]

  /**
   * Get the session ID associated with the current block.
   */
  getSessionId(): number | null

  /**
   * Check if the hosts file contains orphaned toDoSo entries.
   */
  hasOrphanedEntries(): Promise<boolean>

  /**
   * Remove orphaned entries without checking session state.
   */
  removeOrphanedEntries(): Promise<void>
}
