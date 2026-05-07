/**
 * positioning/alignment.ts
 * Pure functions for aligning objects relative to a bounding box or a reference object.
 *
 * All functions return NEW object arrays — immutable updates, safe for React state.
 */

import { getBoundingBox, getObjectBoundingBox } from './boundingBox';
import type {
  PositionableObject,
  HorizontalAlignment,
  VerticalAlignment,
  AlignOptions,
  PositionUpdate,
  BoundingBox,
} from './types';

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Resolves the reference bounding box:
 *  - mode='bounding-box' → union AABB of all objects.
 *  - mode='reference'    → AABB of the single reference object.
 */
function resolveReferenceBBox(
  objects: PositionableObject[],
  options: AlignOptions,
): BoundingBox | null {
  if (options.mode === 'reference' && options.referenceId) {
    const ref = objects.find((o) => o.id === options.referenceId);
    if (ref) return getObjectBoundingBox(ref);
  }
  return getBoundingBox(objects);
}

// ─── Horizontal Alignment ─────────────────────────────────────────────────────

/**
 * Aligns objects horizontally (left, center, right).
 *
 * Math for center: x = refCenterX - (width / 2)
 * Math for right:  x = refRight   - width
 *
 * Complexity: O(n)
 * @returns Array of { id, x, y } partial updates for all moved objects.
 */
export function alignHorizontal(
  objects: PositionableObject[],
  alignment: HorizontalAlignment,
  options: AlignOptions,
): PositionUpdate[] {
  if (objects.length === 0) return [];

  const ref = resolveReferenceBBox(objects, options);
  if (!ref) return [];

  return objects.map((obj): PositionUpdate => {
    let newX: number;

    switch (alignment) {
      case 'left':
        newX = ref.left;
        break;
      case 'center':
        // x = x_center_of_reference - (own_width / 2)
        newX = ref.centerX - obj.width / 2;
        break;
      case 'right':
        newX = ref.right - obj.width;
        break;
    }

    return { id: obj.id, x: newX, y: obj.y };
  });
}

// ─── Vertical Alignment ───────────────────────────────────────────────────────

/**
 * Aligns objects vertically (top, middle, bottom).
 *
 * Math for middle: y = refCenterY - (height / 2)
 * Math for bottom: y = refBottom  - height
 *
 * Complexity: O(n)
 * @returns Array of { id, x, y } partial updates for all moved objects.
 */
export function alignVertical(
  objects: PositionableObject[],
  alignment: VerticalAlignment,
  options: AlignOptions,
): PositionUpdate[] {
  if (objects.length === 0) return [];

  const ref = resolveReferenceBBox(objects, options);
  if (!ref) return [];

  return objects.map((obj): PositionUpdate => {
    let newY: number;

    switch (alignment) {
      case 'top':
        newY = ref.top;
        break;
      case 'middle':
        newY = ref.centerY - obj.height / 2;
        break;
      case 'bottom':
        newY = ref.bottom - obj.height;
        break;
    }

    return { id: obj.id, x: obj.x, y: newY };
  });
}

// ─── Apply updates helper ─────────────────────────────────────────────────────

/**
 * Merges a list of PositionUpdates back into the original object array.
 * Returns a new array — original objects are not mutated.
 *
 * Complexity: O(n) with a Map lookup per update.
 */
export function applyPositionUpdates(
  objects: PositionableObject[],
  updates: PositionUpdate[],
): PositionableObject[] {
  if (updates.length === 0) return objects;

  const updateMap = new Map<string, PositionUpdate>(updates.map((u) => [u.id, u]));

  return objects.map((obj) => {
    const upd = updateMap.get(obj.id);
    if (!upd) return obj;
    return { ...obj, x: upd.x, y: upd.y };
  });
}
