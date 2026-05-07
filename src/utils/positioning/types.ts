/**
 * positioning/types.ts
 * Core type definitions shared across the positioning module.
 */

// ─── Object Representation ────────────────────────────────────────────────────

/**
 * Canonical representation of a positionable object on the canvas.
 * All values are in the parent's local coordinate space.
 */
export interface PositionableObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Rotation in degrees (clockwise, Konva convention). Defaults to 0. */
  rotation?: number;
  /** ID of the parent frame/group. If null/undefined → root canvas space. */
  parentId?: string | null;
}

// ─── Bounding Box ─────────────────────────────────────────────────────────────

/**
 * Axis-aligned bounding box in the target coordinate space.
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Convenience aliases */
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

// ─── Alignment ────────────────────────────────────────────────────────────────

export type HorizontalAlignment = 'left' | 'center' | 'right';
export type VerticalAlignment = 'top' | 'middle' | 'bottom';
export type AlignmentMode = 'bounding-box' | 'reference';

export interface AlignOptions {
  mode: AlignmentMode;
  /** Used when mode = 'reference'. ID of the reference object. */
  referenceId?: string;
}

// ─── Distribution ─────────────────────────────────────────────────────────────

export type DistributionAxis = 'horizontal' | 'vertical';

// ─── Snapping / Smart Guides ──────────────────────────────────────────────────

export const SNAP_THRESHOLD = 5; // px

export interface SnapEdges {
  left: number;
  centerX: number;
  right: number;
  top: number;
  centerY: number;
  bottom: number;
}

/**
 * A guide line to render on the canvas when snapping is active.
 */
export interface GuideLineH {
  type: 'horizontal';
  y: number;
  /** x range to draw the guide line, for visual clarity */
  xStart: number;
  xEnd: number;
}

export interface GuideLineV {
  type: 'vertical';
  x: number;
  yStart: number;
  yEnd: number;
}

export type GuideLine = GuideLineH | GuideLineV;

export interface SnapResult {
  /** Snapped position of the dragged object */
  x: number;
  y: number;
  /** Guide lines to render */
  guides: GuideLine[];
}

// ─── Coordinate System ────────────────────────────────────────────────────────

/**
 * A flat map of frame/group origins in global (canvas) space.
 * key = parentId, value = { x, y } of that parent's top-left corner.
 */
export type FrameOriginMap = Map<string, { x: number; y: number }>;

// ─── Partial update (immutable) ───────────────────────────────────────────────

export type PositionUpdate = Pick<PositionableObject, 'id' | 'x' | 'y'>;
