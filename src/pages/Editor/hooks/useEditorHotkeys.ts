import { useEffect, useRef } from 'react';

interface UseEditorHotkeysProps {
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onUndo: () => void;
  onRedo: () => void;
}

export function useEditorHotkeys({ setZoom, onUndo, onRedo }: UseEditorHotkeysProps) {
  const canvasAreaRef = useRef<HTMLElement>(null);

  // Ctrl/Cmd+scroll to zoom
  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(z => Math.min(Math.max(0.1, z - e.deltaY * 0.002), 5));
      }
    };

    area.addEventListener('wheel', handleWheel, { passive: false });
    return () => area.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  // Ctrl/Cmd+Z  → undo
  // Ctrl/Cmd+Shift+Z or Ctrl+Y → redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when the user is typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          e.preventDefault();
          onRedo();
        } else {
          e.preventDefault();
          onUndo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        onRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo]);

  return {
    canvasAreaRef,
  };
}
