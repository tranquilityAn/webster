import { useState, useRef, useCallback, useEffect } from 'react';
import { MAX_RECENT_COLORS } from '../Editor.constants';

interface UseEditorDrawingProps {
  stageRef: React.RefObject<any>;
  onCommit: (points: number[], attrs: any) => void;
}

export const useEditorDrawing = ({ stageRef, onCommit }: UseEditorDrawingProps) => {
  // Brush settings
  const [brushColor, setBrushColor] = useState('#EDE986');
  const [brushSize, setBrushSize] = useState(4);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushLineCap, setBrushLineCap] = useState<'round' | 'square' | 'butt'>('round');
  const [brushTension, setBrushTension] = useState(0.5);

  // Color history
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('webster_recent_colors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('webster_recent_colors', JSON.stringify(recentColors));
  }, [recentColors]);

  const addRecentColor = useCallback((color: string) => {
    setRecentColors(prev => {
      const normalized = color.toUpperCase();
      const filtered = prev.filter(c => c.toUpperCase() !== normalized);
      return [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    });
  }, []);

  // Drawing state
  const isDrawingRef = useRef(false);
  const currentLineRef = useRef<number[]>([]);
  const [livePoints, setLivePoints] = useState<number[] | null>(null);
  const brushColorRef = useRef(brushColor);

  useEffect(() => {
    brushColorRef.current = brushColor;
  }, [brushColor]);

  const getScaledPointer = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    return stage.getPointerPosition();
  }, [stageRef]);

  const handleMouseDown = useCallback((e: any) => {
    const pos = getScaledPointer();
    if (!pos) return;

    isDrawingRef.current = true;
    currentLineRef.current = [pos.x, pos.y];
    setLivePoints([pos.x, pos.y]);
  }, [getScaledPointer]);

  const handleMouseMove = useCallback((e: any) => {
    if (!isDrawingRef.current) return;
    const pos = getScaledPointer();
    if (!pos) return;

    const newPoints = [...currentLineRef.current, pos.x, pos.y];
    currentLineRef.current = newPoints;
    setLivePoints(newPoints);
  }, [getScaledPointer]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const points = currentLineRef.current;
    if (points.length >= 4) {
      onCommit(points, {
        stroke: brushColorRef.current,
        strokeWidth: brushSize,
        opacity: brushOpacity,
        lineCap: brushLineCap,
        tension: brushTension,
      });
      addRecentColor(brushColorRef.current);
    }

    setLivePoints(null);
    currentLineRef.current = [];
  }, [onCommit, addRecentColor, brushSize, brushOpacity, brushLineCap, brushTension]);

  return {
    brushColor, setBrushColor,
    brushSize, setBrushSize,
    brushOpacity, setBrushOpacity,
    brushLineCap, setBrushLineCap,
    brushTension, setBrushTension,
    recentColors,
    livePoints,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
