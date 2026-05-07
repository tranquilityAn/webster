/**
 * hooks/usePositioning.ts
 * 
 * React hook that integrates the entire positioning module with the Editor's
 * canvas state. Provides a stable, memoised API for:
 *
 *   - getBBox()              → BoundingBox of currently selected objects
 *   - alignH(alignment)     → Align selected objects horizontally
 *   - alignV(alignment)     → Align selected objects vertically
 *   - distribute(axis)      → Distribute selected objects with equal spacing
 *   - distributeCenters(ax) → Distribute selected objects by center points
 *   - snapDrag(id, x, y)    → Snap a dragging object, get guides
 *   - clearGuides()          → Clear snap guide lines after drag end
 *   - guides                → Current guide lines for rendering
 *   - localToGlobal(obj)    → Convert object position to global space
 *   - globalToLocal(x,y,pid)→ Convert position to a parent's local space
 *
 * Integration contract:
 *   - `objects`      — flat list of PositionableObject (all visible nodes).
 *   - `selectedIds`  — Set of selected object IDs.
 *   - `onCommit`     — Called with { id, x, y }[] when alignment/distribution
 *                      results should be persisted via WebSocket.
 *   - `frameOrigins` — Optional FrameOriginMap for local↔global transforms.
 *
 * The hook is intentionally decoupled from Konva types; callers are responsible
 * for mapping Konva node data to PositionableObject before passing it in.
 */

import { useMemo, useCallback, useRef, useState } from 'react';
import {
  // Types
  type PositionableObject,
  type HorizontalAlignment,
  type VerticalAlignment,
  type DistributionAxis,
  type AlignOptions,
  type GuideLine,
  type SnapResult,
  type FrameOriginMap,
  // BoundingBox
  getBoundingBox,
  getObjectBoundingBox,
  // Alignment
  alignHorizontal,
  alignVertical,
  // Distribution
  distributeSpacing,
  distributeCenters,
  // Snapping
  buildEdgeIndex,
  computeSnap,
  computeSnapResize,
  type ResizeBox,
  // Coordinates
  localToGlobal as _localToGlobal,
  globalToLocal as _globalToLocal,
  type IndexedEdges,
} from '../../../utils/positioning';

// ─── Hook props ───────────────────────────────────────────────────────────────

interface UsePositioningProps {
  /** All positionable objects on the canvas (all layers flattened). */
  objects: PositionableObject[];
  /** Currently selected object IDs. */
  selectedIds: Set<string>;
  /**
   * Callback to persist position changes.
   * Each update: { id, x, y } in the object's local coordinate space.
   */
  onCommit: (updates: { id: string; x: number; y: number }[]) => void;
  /**
   * Optional alignment mode. Defaults to 'bounding-box'.
   * When 'reference', you should set referenceId.
   */
  alignMode?: AlignOptions['mode'];
  /** ID of the reference object for reference-mode alignment. */
  referenceId?: string;
  /** Optional frame origin map for coordinate system conversion. */
  frameOrigins?: FrameOriginMap;
  /** Snap threshold in px. Defaults to 5. */
  snapThreshold?: number;
}

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UsePositioningReturn {
  // ── Bounding Box ────────────────────────────────────────────────────────────
  /** AABB of currently selected objects (null if nothing selected). */
  selectionBBox: ReturnType<typeof getBoundingBox>;
  /** AABB of a single object by ID (with rotation). */
  getObjectBBox: (id: string) => ReturnType<typeof getObjectBoundingBox> | null;

  // ── Alignment ───────────────────────────────────────────────────────────────
  /** Align selected objects horizontally and commit the result. */
  alignH: (alignment: HorizontalAlignment) => void;
  /** Align selected objects vertically and commit the result. */
  alignV: (alignment: VerticalAlignment) => void;

  // ── Distribution ────────────────────────────────────────────────────────────
  /** Distribute selected objects with equal edge-to-edge gaps. */
  distribute: (axis: DistributionAxis) => void;
  /** Distribute selected objects with equal center-to-center spacing. */
  distributeByCenter: (axis: DistributionAxis) => void;

  // ── Snapping & Smart Guides ─────────────────────────────────────────────────
  /**
   * Call during drag-move. Returns snapped position and guide lines to draw.
   * Guide lines are also stored in `guides` state for rendering.
   */
  snapDrag: (
    draggedId: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => SnapResult;
  /**
   * Call inside Transformer's boundBoxFunc during resize.
   * Returns the snapped box synchronously; guides are scheduled on next frame.
   */
  snapResize: (
    draggedId: string,
    newBox: ResizeBox,
    anchor: string | undefined,
  ) => ResizeBox;
  /** Clear guide lines after drag/transform ends. */
  clearGuides: () => void;
  /** Current smart guide lines (to be rendered on the canvas overlay). */
  guides: GuideLine[];
  /** Whether snapping is currently enabled. */
  snapEnabled: boolean;
  setSnapEnabled: (enabled: boolean) => void;

  // ── Coordinate System ────────────────────────────────────────────────────────
  /** Convert an object's local position to global canvas space. */
  toGlobal: (obj: PositionableObject) => { x: number; y: number };
  /** Convert global canvas coordinates to a parent frame's local space. */
  toLocal: (
    globalX: number,
    globalY: number,
    parentId?: string | null,
  ) => { x: number; y: number };
}

// ─── Hook Implementation ──────────────────────────────────────────────────────

export function usePositioning({
  objects,
  selectedIds,
  onCommit,
  alignMode = 'bounding-box',
  referenceId,
  frameOrigins = new Map(),
  snapThreshold,
}: UsePositioningProps): UsePositioningReturn {

  // ── Snap state ───────────────────────────────────────────────────────────────
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true);

  // ── Derived: selected objects (memoised) ─────────────────────────────────────
  const selectedObjects = useMemo(
    () => objects.filter((o) => selectedIds.has(o.id)),
    [objects, selectedIds],
  );

  // ── Derived: all objects that are NOT selected (snap candidates) ─────────────
  const nonSelectedObjects = useMemo(
    () => objects.filter((o) => !selectedIds.has(o.id)),
    [objects, selectedIds],
  );

  // ── Precomputed edge index (updates only when non-selected objects change) ────
  // We store it in a ref so snapDrag doesn't trigger re-renders.
  const edgeIndexRef = useRef<IndexedEdges[]>([]);
  edgeIndexRef.current = useMemo(
    () => buildEdgeIndex(nonSelectedObjects),
    [nonSelectedObjects],
  );

  // ── BoundingBox ───────────────────────────────────────────────────────────────
  const selectionBBox = useMemo(
    () => getBoundingBox(selectedObjects),
    [selectedObjects],
  );

  const objectById = useMemo(
    () => new Map(objects.map((o) => [o.id, o])),
    [objects],
  );

  const getObjectBBox = useCallback(
    (id: string) => {
      const obj = objectById.get(id);
      return obj ? getObjectBoundingBox(obj) : null;
    },
    [objectById],
  );

  // ── Alignment options (stable reference when deps don't change) ───────────────
  const alignOptions: AlignOptions = useMemo(
    () => ({ mode: alignMode, referenceId }),
    [alignMode, referenceId],
  );

  // ── Alignment callbacks ───────────────────────────────────────────────────────
  const alignH = useCallback(
    (alignment: HorizontalAlignment) => {
      if (selectedObjects.length < 2) return;
      const updates = alignHorizontal(selectedObjects, alignment, alignOptions);
      onCommit(updates);
    },
    [selectedObjects, alignOptions, onCommit],
  );

  const alignV = useCallback(
    (alignment: VerticalAlignment) => {
      if (selectedObjects.length < 2) return;
      const updates = alignVertical(selectedObjects, alignment, alignOptions);
      onCommit(updates);
    },
    [selectedObjects, alignOptions, onCommit],
  );

  // ── Distribution callbacks ────────────────────────────────────────────────────
  const distribute = useCallback(
    (axis: DistributionAxis) => {
      if (selectedObjects.length < 3) return;
      const updates = distributeSpacing(selectedObjects, axis);
      onCommit(updates);
    },
    [selectedObjects, onCommit],
  );

  const distributeByCenter = useCallback(
    (axis: DistributionAxis) => {
      if (selectedObjects.length < 3) return;
      const updates = distributeCenters(selectedObjects, axis);
      onCommit(updates);
    },
    [selectedObjects, onCommit],
  );

  // ── Snapping ─────────────────────────────────────────────────────────────────
  const snapDrag = useCallback(
    (
      draggedId: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ): SnapResult => {
      if (!snapEnabled) {
        return { x, y, guides: [] };
      }

      const result = computeSnap(
        draggedId,
        x,
        y,
        width,
        height,
        edgeIndexRef.current,
        snapThreshold,
      );

      // Update guide state for the overlay renderer
      setGuides(result.guides);

      return result;
    },
    [snapEnabled, snapThreshold],
  );

  const clearGuides = useCallback(() => {
    setGuides([]);
  }, []);

  // ── Resize snapping (for Transformer boundBoxFunc) ────────────────────────────
  const snapResize = useCallback(
    (draggedId: string, newBox: ResizeBox, anchor: string | undefined): ResizeBox => {
      if (!snapEnabled) return newBox;

      const result = computeSnapResize(
        draggedId,
        newBox,
        anchor,
        edgeIndexRef.current,
        snapThreshold,
      );

      // boundBoxFunc is synchronous — schedule guide update on next animation frame
      // to avoid calling setState inside a sync Konva callback.
      if (result.guides.length > 0) {
        requestAnimationFrame(() => setGuides(result.guides));
      }

      return result.box;
    },
    [snapEnabled, snapThreshold],
  );

  // ── Coordinate conversion ─────────────────────────────────────────────────────
  const toGlobal = useCallback(
    (obj: PositionableObject) => _localToGlobal(obj, frameOrigins),
    [frameOrigins],
  );

  const toLocal = useCallback(
    (globalX: number, globalY: number, parentId?: string | null) =>
      _globalToLocal(globalX, globalY, parentId, frameOrigins),
    [frameOrigins],
  );

  // ── Return ────────────────────────────────────────────────────────────────────
  return {
    selectionBBox,
    getObjectBBox,
    alignH,
    alignV,
    distribute,
    distributeByCenter,
    snapDrag,
    snapResize,
    clearGuides,
    guides,
    snapEnabled,
    setSnapEnabled,
    toGlobal,
    toLocal,
  };
}
