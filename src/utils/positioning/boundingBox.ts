/**
 * positioning/boundingBox.ts
 * Pure functions for computing axis-aligned bounding boxes,
 * including support for rotated objects.
 */

import type { PositionableObject, BoundingBox } from './types';

// ─── Internal helpers ─────────────────────────────────────────────────────────

const DEG_TO_RAD = Math.PI / 180;

/**
 * Returns the four rotated corner points of a rectangle.
 * The pivot is the object's own top-left corner (Konva default).
 */
function getRotatedCorners(
  x: number,
  y: number,
  width: number,
  height: number,
  rotationDeg: number,
): [number, number][] {
  const angle = rotationDeg * DEG_TO_RAD;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Corners relative to origin (x, y)
  const corners: [number, number][] = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];

  return corners.map(([cx, cy]) => [
    x + cx * cos - cy * sin,
    y + cx * sin + cy * cos,
  ]);
}

/**
 * Builds a normalised BoundingBox from (minX, minY, maxX, maxY).
 */
function makeBoundingBox(minX: number, minY: number, maxX: number, maxY: number): BoundingBox {
  const width = maxX - minX;
  const height = maxY - minY;
  return {
    x: minX,
    y: minY,
    width,
    height,
    left: minX,
    top: minY,
    right: maxX,
    bottom: maxY,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes the axis-aligned bounding box of a single object,
 * taking its rotation into account.
 *
 * Complexity: O(1)
 */
export function getObjectBoundingBox(obj: PositionableObject): BoundingBox {
  const rotation = obj.rotation ?? 0;

  if (rotation === 0) {
    return makeBoundingBox(obj.x, obj.y, obj.x + obj.width, obj.y + obj.height);
  }

  const corners = getRotatedCorners(obj.x, obj.y, obj.width, obj.height, rotation);
  const xs = corners.map(([cx]) => cx);
  const ys = corners.map(([, cy]) => cy);

  return makeBoundingBox(
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
  );
}

/**
 * Computes the union axis-aligned bounding box for a group of objects.
 * Returns null for an empty array.
 *
 * Supports rotation per object.
 * Complexity: O(n)
 */
export function getBoundingBox(objects: PositionableObject[]): BoundingBox | null {
  if (objects.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const obj of objects) {
    const bb = getObjectBoundingBox(obj);
    if (bb.left < minX)   minX = bb.left;
    if (bb.top < minY)    minY = bb.top;
    if (bb.right > maxX)  maxX = bb.right;
    if (bb.bottom > maxY) maxY = bb.bottom;
  }

  return makeBoundingBox(minX, minY, maxX, maxY);
}

/**
 * Computes the "logical" bounding box without rotation, i.e., treating the
 * object as axis-aligned. Useful when you need to operate on the declared
 * x/y/width/height directly (e.g., for alignment math that targets the origin
 * corner before rotation is applied).
 *
 * Complexity: O(1)
 */
export function getLogicalBoundingBox(obj: PositionableObject): BoundingBox {
  return makeBoundingBox(obj.x, obj.y, obj.x + obj.width, obj.y + obj.height);
}
