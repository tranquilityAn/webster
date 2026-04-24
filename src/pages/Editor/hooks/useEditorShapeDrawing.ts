import { useState, useRef, useCallback } from 'react';
import type { ShapeType } from '../Editor.constants';

interface DrawingState {
  shapeType: ShapeType;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseEditorShapeDrawingProps {
  stageRef: React.RefObject<any>;
  zoom: number;
  onCommit: (shapeType: ShapeType, attrs: Record<string, unknown>) => void;
}

/** Returns stage-space pointer position accounting for zoom scale */
function getStagePointer(stage: any): { x: number; y: number } | null {
  return stage?.getPointerPosition() ?? null;
}

/** Computes normalised Rect geometry from two arbitrary points */
function rectFromPoints(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

export const useEditorShapeDrawing = ({
  stageRef,
  onCommit,
}: UseEditorShapeDrawingProps) => {
  const [liveShape, setLiveShape] = useState<DrawingState | null>(null);
  const isDrawingRef = useRef(false);

  const handleMouseDown = useCallback((e: any, shapeType: ShapeType) => {
    const pos = getStagePointer(stageRef.current);
    if (!pos) return;

    isDrawingRef.current = true;
    setLiveShape({ shapeType, startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
  }, [stageRef]);

  const handleMouseMove = useCallback((e: any) => {
    if (!isDrawingRef.current || !liveShape) return;
    const pos = getStagePointer(stageRef.current);
    if (!pos) return;

    setLiveShape(prev => prev ? { ...prev, currentX: pos.x, currentY: pos.y } : null);
  }, [stageRef, liveShape]);

  const handleMouseUp = useCallback((
    shapeType: ShapeType,
    shapeAttrs: { fill: string; stroke: string; strokeWidth: number; opacity: number },
  ) => {
    if (!isDrawingRef.current || !liveShape) return;
    isDrawingRef.current = false;

    const { startX, startY, currentX, currentY } = liveShape;
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // Skip tiny accidental clicks
    if (width < 5 && height < 5) {
      setLiveShape(null);
      return;
    }

    setLiveShape(null);
    
    if (shapeType === 'line' || shapeType === 'arrow') {
      onCommit(shapeType, { 
        ...shapeAttrs, 
        points: [startX, startY, currentX, currentY] 
      });
    } else {
      onCommit(shapeType, { 
        ...shapeAttrs, 
        ...rectFromPoints(startX, startY, currentX, currentY) 
      });
    }
  }, [liveShape, onCommit]);

  /** Preview geometry derived from live state – passed to Konva for render */
  const getLiveShapeAttrs = useCallback(() => {
    if (!liveShape) return null;
    const { startX, startY, currentX, currentY, shapeType } = liveShape;
    
    if (shapeType === 'line' || shapeType === 'arrow') {
      return { 
        points: [startX, startY, currentX, currentY], 
        shapeType 
      };
    }
    
    return { ...rectFromPoints(startX, startY, currentX, currentY), shapeType };
  }, [liveShape]);

  return {
    isDrawing: isDrawingRef.current,
    liveShapeAttrs: getLiveShapeAttrs(),
    handleShapeMouseDown: handleMouseDown,
    handleShapeMouseMove: handleMouseMove,
    handleShapeMouseUp: handleMouseUp,
  };
};
