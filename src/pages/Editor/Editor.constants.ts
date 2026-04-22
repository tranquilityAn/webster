import React from 'react';
import {
  IconSelect,
  IconPen,
  IconImage,
  IconShapes,
  IconText,
  IconRect,
  IconCircle,
  IconPolygon,
  IconStar,
} from './components/EditorIcons';

// Tool IDs
export type ToolId = 'select' | 'pen' | 'image' | 'shapes' | 'text';
export type ShapeType = 'rect' | 'ellipse' | 'polygon' | 'star';

export const TOOLS = [
  { id: 'select' as ToolId, label: 'Select (V)',  Icon: IconSelect },
  { id: 'pen'    as ToolId, label: 'Pen (P)',     Icon: IconPen    },
  { id: 'image'  as ToolId, label: 'Image (I)',   Icon: IconImage  },
  { id: 'shapes' as ToolId, label: 'Shapes (O)',  Icon: IconShapes },
  { id: 'text'   as ToolId, label: 'Text (T)',    Icon: IconText   },
];

/** Shape definitions — drives both the flyout menu and Konva class mapping */
export const SHAPE_DEFS: { type: ShapeType; label: string; Icon: React.FC; konvaClass: string }[] = [
  { type: 'rect',    label: 'Rectangle', Icon: IconRect,    konvaClass: 'Rect'           },
  { type: 'ellipse', label: 'Circle',    Icon: IconCircle,  konvaClass: 'Circle'         },
  { type: 'polygon', label: 'Polygon',   Icon: IconPolygon, konvaClass: 'RegularPolygon' },
  { type: 'star',    label: 'Star',      Icon: IconStar,    konvaClass: 'Star'           },
];

export const MAX_RECENT_COLORS = 8;
