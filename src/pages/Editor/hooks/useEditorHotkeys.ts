import { useEffect, useRef } from 'react';

interface UseEditorHotkeysProps {
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

export function useEditorHotkeys({ setZoom }: UseEditorHotkeysProps) {
  const canvasAreaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;

    const handleWheel = (e: WheelEvent) => {
      // Zoom with Ctrl or Meta key
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(z => Math.min(Math.max(0.1, z - e.deltaY * 0.002), 5));
      }
    };

    area.addEventListener('wheel', handleWheel, { passive: false });
    return () => area.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  return {
    canvasAreaRef,
  };
}
