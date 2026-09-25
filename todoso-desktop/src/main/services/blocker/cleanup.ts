/**
 * Cleanup — removes orphaned toDoSo entries from the hosts file on startup.
 *
 * This is the first line of defense: if the app crashed during a session,
 * the hosts file might still contain our blocking entries. We clean them
 * up before anything else.
 */

import type { IBlocker } from './IBlocker'

export async function cleanupOrphanedBlocks(blocker: IBlocker): Promise<void> {
  const hasOrphans = await blocker.hasOrphanedEntries()

  if (hasOrphans) {
    console.log('[Cleanup] Found orphaned toDoSo entries in hosts file — removing...')
    await blocker.removeOrphanedEntries()
    console.log('[Cleanup] Orphaned entries removed successfully')
  } else {
    console.log('[Cleanup] No orphaned entries found — hosts file is clean')
  }
}
