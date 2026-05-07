/**
 * positioning/coordinates.ts
 * Coordinate system utilities: converting between local (parent-relative)
 * and global (canvas-absolute) spaces.
 *
 * Webster uses a flat layer model (Konva), but objects can logically belong
 * to a Frame (group) whose origin defines the local coordinate space.
 *
 * Conventions:
 *   - "global" = canvas top-left is (0, 0).
 *   - "local"  = parent frame's top-left is (0, 0).
 *   - Frames themselves are positioned in global space (or their own parent's space).
 *
 * The FrameOriginMap is a flattened map of every frame's global origin,
 * so nested groups are resolved in one lookup rather than a tree walk.
 */

import type { PositionableObject, FrameOriginMap } from './types';

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Converts an object's local coordinates to global canvas coordinates.
 *
 * If the object has no parent (root), local === global.
 *
 * @param obj     - The object with local x, y.
 * @param origins - Precomputed frame origin map.
 * @returns       - { x, y } in global space.
 */
export function localToGlobal(
  obj: PositionableObject,
  origins: FrameOriginMap,
): { x: number; y: number } {
  if (!obj.parentId) {
    return { x: obj.x, y: obj.y };
  }

  const origin = origins.get(obj.parentId);
  if (!origin) {
    // Parent not found in map → treat as root (defensive fallback)
    console.warn(`[positioning] Frame origin not found for parentId="${obj.parentId}"`);
    return { x: obj.x, y: obj.y };
  }

  return {
    x: origin.x + obj.x,
    y: origin.y + obj.y,
  };
}

/**
 * Converts global canvas coordinates to an object's local (parent-relative) space.
 *
 * @param globalX - X in canvas space.
 * @param globalY - Y in canvas space.
 * @param parentId - ID of the target parent frame, or null/undefined for root.
 * @param origins  - Precomputed frame origin map.
 * @returns        - { x, y } relative to the parent's top-left.
 */
export function globalToLocal(
  globalX: number,
  globalY: number,
  parentId: string | null | undefined,
  origins: FrameOriginMap,
): { x: number; y: number } {
  if (!parentId) {
    return { x: globalX, y: globalY };
  }

  const origin = origins.get(parentId);
  if (!origin) {
    console.warn(`[positioning] Frame origin not found for parentId="${parentId}"`);
    return { x: globalX, y: globalY };
  }

  return {
    x: globalX - origin.x,
    y: globalY - origin.y,
  };
}

/**
 * Builds a FrameOriginMap from a flat list of frame objects.
 *
 * This is designed to handle ONE level of nesting at a time.
 * For deeply nested frames, call this function with the full frame hierarchy
 * sorted from outermost to innermost, so that parent origins are resolved first.
 *
 * @param frames - Objects that act as frames/groups (have children).
 * @param existingOrigins - Optional base map to extend (for nested resolution).
 * @returns A new Map<frameId, { x, y }> of global origins.
 *
 * Complexity: O(f) where f = number of frames.
 */
export function buildFrameOriginMap(
  frames: PositionableObject[],
  existingOrigins: FrameOriginMap = new Map(),
): FrameOriginMap {
  const result: FrameOriginMap = new Map(existingOrigins);

  for (const frame of frames) {
    const globalOrigin = localToGlobal(frame, result);
    result.set(frame.id, globalOrigin);
  }

  return result;
}

/**
 * Converts a full object from local to global coordinate space.
 * Returns a new object — does not mutate the original.
 *
 * Complexity: O(1) per call (with precomputed origins).
 */
export function toGlobalObject(
  obj: PositionableObject,
  origins: FrameOriginMap,
): PositionableObject {
  const { x, y } = localToGlobal(obj, origins);
  return { ...obj, x, y, parentId: undefined };
}

/**
 * Converts a full object from global to local coordinate space.
 * Returns a new object — does not mutate the original.
 *
 * Complexity: O(1) per call (with precomputed origins).
 */
export function toLocalObject(
  obj: PositionableObject,
  parentId: string | null | undefined,
  origins: FrameOriginMap,
): PositionableObject {
  const { x, y } = globalToLocal(obj.x, obj.y, parentId, origins);
  return { ...obj, x, y, parentId };
}
