import { KonvaStageConfig, buildSnapshot, Commit } from '@paranoideed/drawebster';

/**
 * Computes the final canvas state by applying all un-snapshotted commits to the base snapshot.
 * @param snapshot The base snapshot from the store
 * @param commits The list of commits since that snapshot
 * @returns The final KonvaStageConfig to be rendered
 */
export function getComputedCanvasState(
  snapshot: { version: number; body: KonvaStageConfig } | null,
  commits: Commit[]
): KonvaStageConfig | null {
  if (!snapshot) return null;
  
  // If no commits, return the snapshot body directly
  if (!commits || commits.length === 0) {
    return snapshot.body;
  }

  try {
    // buildSnapshot handles the application of operations (add, move, update, etc.)
    return buildSnapshot(snapshot.body, commits);
  } catch (error) {
    console.error('Failed to compute canvas state:', error);
    // Fallback to snapshot if building fails
    return snapshot.body;
  }
}
