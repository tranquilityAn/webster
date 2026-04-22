import { useState, useRef, useCallback, useEffect } from 'react';

export const useEditorNavigation = () => {
  const [zoom, setZoom] = useState<number>(0.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const lastPointerRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);

  const startPanning = useCallback((clientX: number, clientY: number) => {
    isPanningRef.current = true;
    lastPointerRef.current = { x: clientX, y: clientY };
  }, []);

  const handlePanning = useCallback((clientX: number, clientY: number) => {
    if (!isPanningRef.current) return;
    const dx = clientX - lastPointerRef.current.x;
    const dy = clientY - lastPointerRef.current.y;
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastPointerRef.current = { x: clientX, y: clientY };
  }, []);

  const stopPanning = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
    }
  }, []);

  const zoomIn = useCallback(() => setZoom(z => Math.min(5, z + 0.1)), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(0.1, z - 0.1)), []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePanning(e.clientX, e.clientY);
    const onMouseUp = () => stopPanning();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handlePanning, stopPanning]);

  return {
    zoom,
    pan,
    setZoom,
    setPan,
    startPanning,
    zoomIn,
    zoomOut,
  };
};
