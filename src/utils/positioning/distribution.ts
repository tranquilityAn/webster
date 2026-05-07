/**
 * positioning/distribution.ts
 * Pure functions for distributing objects with equal spacing.
 *
 * Rules:
 *  - The two outermost objects (by edge) keep their positions fixed.
 *  - Inner objects are repositioned so the gap between each pair is equal.
 *  - Requires ≥ 3 objects; fewer objects are returned unchanged.
 *
 * All functions return NEW object arrays — immutable updates.
 */

import type { PositionableObject, DistributionAxis, PositionUpdate } from './types';

// ─── Shared sorting & gap logic ───────────────────────────────────────────────

interface ObjectMetric {
  id: string;
  /** Leading edge along the axis (left for H, top for V) */
  start: number;
  /** Trailing edge along the axis */
  end: number;
  /** Object's own dimension along the axis */
  size: number;
  /** Current other-axis position, unchanged */
  otherX: number;
  otherY: number;
}

function buildMetrics(
  objects: PositionableObject[],
  axis: DistributionAxis,
): ObjectMetric[] {
  return objects.map((obj) => {
    if (axis === 'horizontal') {
      return {
        id: obj.id,
        start: obj.x,
        end: obj.x + obj.width,
        size: obj.width,
        otherX: obj.x,   // will be ignored for axis coord
        otherY: obj.y,
      };
    } else {
      return {
        id: obj.id,
        start: obj.y,
        end: obj.y + obj.height,
        size: obj.height,
        otherX: obj.x,
        otherY: obj.y,
      };
    }
  });
}

// ─── Main distribution function ───────────────────────────────────────────────

/**
 * Distributes objects evenly along the given axis.
 *
 * Algorithm:
 *   1. Sort objects by their leading edge (start coord).
 *   2. Fix the first and last objects.
 *   3. Calculate total available space between the outer edges.
 *   4. Calculate total size occupied by all objects.
 *   5. Distribute the remaining gap equally between all inner gaps.
 *
 * Complexity: O(n log n) due to sort.
 * @returns Array of { id, x, y } for all repositioned objects.
 */
export function distributeSpacing(
  objects: PositionableObject[],
  axis: DistributionAxis,
): PositionUpdate[] {
  if (objects.length < 3) {
    // Nothing to distribute — return no-op updates
    return objects.map((o) => ({ id: o.id, x: o.x, y: o.y }));
  }

  const metrics = buildMetrics(objects, axis);

  // Sort by leading edge
  const sorted = [...metrics].sort((a, b) => a.start - b.start);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  // Total span from first.start → last.end
  const totalSpan = last.end - first.start;

  // Sum of all object sizes
  const totalSize = sorted.reduce((acc, m) => acc + m.size, 0);

  // Available gap to distribute between (n-1) spaces
  const n = sorted.length;
  const totalGap = totalSpan - totalSize;
  const equalGap = totalGap / (n - 1);

  // Reposition: walk through sorted list, accumulate positions
  const updates: PositionUpdate[] = [];
  let cursor = first.start;

  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i];

    if (axis === 'horizontal') {
      updates.push({ id: m.id, x: cursor, y: m.otherY });
    } else {
      updates.push({ id: m.id, x: m.otherX, y: cursor });
    }

    cursor += m.size + equalGap;
  }

  return updates;
}

/**
 * Distributes objects so their CENTER POINTS are evenly spaced.
 * This is an alternative mode common in design tools.
 *
 * Complexity: O(n log n)
 */
export function distributeCenters(
  objects: PositionableObject[],
  axis: DistributionAxis,
): PositionUpdate[] {
  if (objects.length < 3) {
    return objects.map((o) => ({ id: o.id, x: o.x, y: o.y }));
  }

  const metrics = buildMetrics(objects, axis);
  const sorted = [...metrics].sort((a, b) => a.start + a.size / 2 - (b.start + b.size / 2));

  const firstCenter = sorted[0].start + sorted[0].size / 2;
  const lastCenter = sorted[sorted.length - 1].start + sorted[sorted.length - 1].size / 2;

  const n = sorted.length;
  const step = (lastCenter - firstCenter) / (n - 1);

  return sorted.map((m, i): PositionUpdate => {
    const center = firstCenter + step * i;
    if (axis === 'horizontal') {
      return { id: m.id, x: center - m.size / 2, y: m.otherY };
    } else {
      return { id: m.id, x: m.otherX, y: center - m.size / 2 };
    }
  });
}
