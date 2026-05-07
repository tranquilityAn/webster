/**
 * positioning/snapping.ts
 * Smart guides and snap-to-edge/center collision detection.
 *
 * Algorithm:
 *   For each candidate object B, we compute 6 snap edges (left, centerX, right,
 *   top, centerY, bottom). We then check if any edge of the dragged object A
 *   falls within SNAP_THRESHOLD of any edge of B. The first matching snap wins
 *   on each axis; then we collect guide lines for all objects that share that
 *   snapped coordinate.
 *
 * Performance notes:
 *   - O(n) per drag event (one pass over candidate edges).
 *   - SnapEdges are precomputed once per object and cached between frames via
 *     the memoised buildEdgeIndex helper.
 *   - Suitable for 100+ objects.
 */

import type {
  PositionableObject,
  SnapEdges,
  SnapResult,
  GuideLine,
} from './types';
import { SNAP_THRESHOLD } from './types';

// ─── Edge Index ───────────────────────────────────────────────────────────────

export interface IndexedEdges {
  id: string;
  edges: SnapEdges;
}

/**
 * Precomputes snap edges for every candidate object.
 * Call this once when the object list changes (not on every mouse move).
 *
 * Complexity: O(n)
 */
export function buildEdgeIndex(objects: PositionableObject[]): IndexedEdges[] {
  return objects.map((obj) => ({
    id: obj.id,
    edges: {
      left:    obj.x,
      centerX: obj.x + obj.width / 2,
      right:   obj.x + obj.width,
      top:     obj.y,
      centerY: obj.y + obj.height / 2,
      bottom:  obj.y + obj.height,
    },
  }));
}

// ─── Candidate edges of the dragged object ────────────────────────────────────

function getDraggedEdges(x: number, y: number, width: number, height: number): SnapEdges {
  return {
    left:    x,
    centerX: x + width / 2,
    right:   x + width,
    top:     y,
    centerY: y + height / 2,
    bottom:  y + height,
  };
}

// ─── Snap along one axis ──────────────────────────────────────────────────────

type AxisEdgeKeys = 'left' | 'centerX' | 'right';
type AxisEdgeVKeys = 'top' | 'centerY' | 'bottom';

/**
 * Given the dragged object's edges and all candidate edges,
 * returns the best snapped X coordinate and the snapped value (for guides),
 * or null if no snap found.
 */
function findSnapX(
  dragged: SnapEdges,
  candidates: IndexedEdges[],
  threshold: number,
): { snappedX: number; guideX: number; sourceKey: AxisEdgeKeys; targetKey: AxisEdgeKeys } | null {
  const dragEdges: AxisEdgeKeys[] = ['left', 'centerX', 'right'];

  let bestDelta = threshold + 1;
  let result: ReturnType<typeof findSnapX> = null;

  for (const candidate of candidates) {
    for (const dragKey of dragEdges) {
      const dragVal = dragged[dragKey];

      const targetEdges: AxisEdgeKeys[] = ['left', 'centerX', 'right'];
      for (const targetKey of targetEdges) {
        const targetVal = candidate.edges[targetKey];
        const delta = Math.abs(dragVal - targetVal);

        if (delta < threshold && delta < bestDelta) {
          bestDelta = delta;
          // Calculate the offset correction so the dragged object snaps perfectly
          const offsetFromLeft = dragVal - dragged.left;
          result = {
            snappedX: targetVal - offsetFromLeft,
            guideX: targetVal,
            sourceKey: dragKey,
            targetKey,
          };
        }
      }
    }
  }
  return result;
}

function findSnapY(
  dragged: SnapEdges,
  candidates: IndexedEdges[],
  threshold: number,
): { snappedY: number; guideY: number; sourceKey: AxisEdgeVKeys; targetKey: AxisEdgeVKeys } | null {
  const dragEdges: AxisEdgeVKeys[] = ['top', 'centerY', 'bottom'];

  let bestDelta = threshold + 1;
  let result: ReturnType<typeof findSnapY> = null;

  for (const candidate of candidates) {
    for (const dragKey of dragEdges) {
      const dragVal = dragged[dragKey];

      const targetEdges: AxisEdgeVKeys[] = ['top', 'centerY', 'bottom'];
      for (const targetKey of targetEdges) {
        const targetVal = candidate.edges[targetKey];
        const delta = Math.abs(dragVal - targetVal);

        if (delta < threshold && delta < bestDelta) {
          bestDelta = delta;
          const offsetFromTop = dragVal - dragged.top;
          result = {
            snappedY: targetVal - offsetFromTop,
            guideY: targetVal,
            sourceKey: dragKey,
            targetKey,
          };
        }
      }
    }
  }
  return result;
}

// ─── Guide line builders ──────────────────────────────────────────────────────

function buildVerticalGuides(
  guideX: number,
  candidates: IndexedEdges[],
  draggedEdges: SnapEdges,
  targetKey: AxisEdgeKeys,
): GuideLine[] {
  // Collect all Y spans (dragged + snapping candidates) to determine guide length
  const yValues: number[] = [draggedEdges.top, draggedEdges.bottom];

  for (const c of candidates) {
    if (Math.abs(c.edges[targetKey] - guideX) < 0.5) {
      yValues.push(c.edges.top, c.edges.bottom);
    }
  }

  return [{
    type: 'vertical',
    x: guideX,
    yStart: Math.min(...yValues) - 16,
    yEnd:   Math.max(...yValues) + 16,
  }];
}

function buildHorizontalGuides(
  guideY: number,
  candidates: IndexedEdges[],
  draggedEdges: SnapEdges,
  targetKey: AxisEdgeVKeys,
): GuideLine[] {
  const xValues: number[] = [draggedEdges.left, draggedEdges.right];

  for (const c of candidates) {
    if (Math.abs(c.edges[targetKey] - guideY) < 0.5) {
      xValues.push(c.edges.left, c.edges.right);
    }
  }

  return [{
    type: 'horizontal',
    y: guideY,
    xStart: Math.min(...xValues) - 16,
    xEnd:   Math.max(...xValues) + 16,
  }];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main snapping function. Call on every drag-move event.
 *
 * @param draggedId   - ID of the object being dragged (excluded from candidates).
 * @param x           - Current (pre-snap) X of the dragged object.
 * @param y           - Current (pre-snap) Y of the dragged object.
 * @param width       - Width of the dragged object.
 * @param height      - Height of the dragged object.
 * @param edgeIndex   - Precomputed edge index (built with buildEdgeIndex).
 * @param threshold   - Snap distance in px (default: SNAP_THRESHOLD = 5).
 *
 * @returns SnapResult with corrected { x, y } and guide lines to draw.
 *
 * Complexity: O(n) — one pass over the index.
 */
export function computeSnap(
  draggedId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  edgeIndex: IndexedEdges[],
  threshold: number = SNAP_THRESHOLD,
): SnapResult {
  // Exclude the dragged object from candidates
  const candidates = edgeIndex.filter((e) => e.id !== draggedId);

  const draggedEdges = getDraggedEdges(x, y, width, height);

  const snapX = findSnapX(draggedEdges, candidates, threshold);
  const snapY = findSnapY(draggedEdges, candidates, threshold);

  const finalX = snapX ? snapX.snappedX : x;
  const finalY = snapY ? snapY.snappedY : y;

  const guides: GuideLine[] = [];

  if (snapX) {
    const snappedDraggedEdges = getDraggedEdges(finalX, finalY, width, height);
    guides.push(
      ...buildVerticalGuides(snapX.guideX, candidates, snappedDraggedEdges, snapX.targetKey),
    );
  }
  if (snapY) {
    const snappedDraggedEdges = getDraggedEdges(finalX, finalY, width, height);
    guides.push(
      ...buildHorizontalGuides(snapY.guideY, candidates, snappedDraggedEdges, snapY.targetKey),
    );
  }

  return { x: finalX, y: finalY, guides };
}

/**
 * Checks if snapping is currently active (any guide lines present).
 */
export function isSnapping(result: SnapResult): boolean {
  return result.guides.length > 0;
}

// ─── Resize snapping ──────────────────────────────────────────────────────────

export interface ResizeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeSnapResult {
  box: ResizeBox;
  guides: GuideLine[];
}

/**
 * Snaps individual edges of a resize bounding box to nearby object edges.
 *
 * @param draggedId   - ID of the object being resized.
 * @param newBox      - The box proposed by Konva.
 * @param anchor      - The name of the active anchor (e.g., 'top-left').
 * @param edgeIndex   - Precomputed edge index.
 * @param threshold   - Snap distance.
 */
export function computeSnapResize(
  draggedId: string,
  newBox: ResizeBox,
  anchor: string | undefined,
  edgeIndex: IndexedEdges[],
  threshold: number = SNAP_THRESHOLD,
): ResizeSnapResult {
  const candidates = edgeIndex.filter((e) => e.id !== draggedId);
  const guides: GuideLine[] = [];
  const MIN_SIZE = 5;

  let { x, y, width, height } = newBox;

  // We need to know which edges are "active" based on the anchor.
  // Konva anchor names:
  // top-left, top-center, top-right
  // middle-left, middle-right
  // bottom-left, bottom-center, bottom-right

  const isTop    = anchor && anchor.includes('top');
  const isBottom = anchor && anchor.includes('bottom');
  const isLeft   = anchor && anchor.includes('left');
  const isRight  = anchor && anchor.includes('right');

  const hEdges: Array<'left' | 'centerX' | 'right'> = ['left', 'centerX', 'right'];
  const vEdges: Array<'top'  | 'centerY' | 'bottom'> = ['top',  'centerY', 'bottom'];

  // ── Left edge ────────────────────────────────────────────────────────────────
  if (isLeft) {
    let bestDelta = threshold + 1;
    const fixedRight = x + width;

    for (const c of candidates) {
      for (const key of hEdges) {
        const targetVal = c.edges[key];
        const delta = Math.abs(x - targetVal);
        if (delta < threshold && delta < bestDelta) {
          const newW = fixedRight - targetVal;
          if (newW >= MIN_SIZE) {
            bestDelta = delta;
            x = targetVal;
            width = newW;
            guides.push({
              type: 'vertical',
              x: targetVal,
              yStart: Math.min(y, c.edges.top) - 20,
              yEnd:   Math.max(y + height, c.edges.bottom) + 20,
            });
          }
        }
      }
    }
  }

  // ── Right edge ───────────────────────────────────────────────────────────────
  if (isRight) {
    let bestDelta = threshold + 1;
    const currentRight = x + width;

    for (const c of candidates) {
      for (const key of hEdges) {
        const targetVal = c.edges[key];
        const delta = Math.abs(currentRight - targetVal);
        if (delta < threshold && delta < bestDelta) {
          const newW = targetVal - x;
          if (newW >= MIN_SIZE) {
            bestDelta = delta;
            width = newW;
            guides.push({
              type: 'vertical',
              x: targetVal,
              yStart: Math.min(y, c.edges.top) - 20,
              yEnd:   Math.max(y + height, c.edges.bottom) + 20,
            });
          }
        }
      }
    }
  }

  // ── Top edge ─────────────────────────────────────────────────────────────────
  if (isTop) {
    let bestDelta = threshold + 1;
    const fixedBottom = y + height;

    for (const c of candidates) {
      for (const key of vEdges) {
        const targetVal = c.edges[key];
        const delta = Math.abs(y - targetVal);
        if (delta < threshold && delta < bestDelta) {
          const newH = fixedBottom - targetVal;
          if (newH >= MIN_SIZE) {
            bestDelta = delta;
            y = targetVal;
            height = newH;
            guides.push({
              type: 'horizontal',
              y: targetVal,
              xStart: Math.min(x, c.edges.left) - 20,
              xEnd:   Math.max(x + width, c.edges.right) + 20,
            });
          }
        }
      }
    }
  }

  // ── Bottom edge ───────────────────────────────────────────────────────────────
  if (isBottom) {
    let bestDelta = threshold + 1;
    const currentBottom = y + height;

    for (const c of candidates) {
      for (const key of vEdges) {
        const targetVal = c.edges[key];
        const delta = Math.abs(currentBottom - targetVal);
        if (delta < threshold && delta < bestDelta) {
          const newH = targetVal - y;
          if (newH >= MIN_SIZE) {
            bestDelta = delta;
            height = newH;
            guides.push({
              type: 'horizontal',
              y: targetVal,
              xStart: Math.min(x, c.edges.left) - 20,
              xEnd:   Math.max(x + width, c.edges.right) + 20,
            });
          }
        }
      }
    }
  }

  return { box: { x, y, width, height }, guides };
}

