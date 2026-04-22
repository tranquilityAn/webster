import { useState, useEffect } from 'react';

export function useEditorLayout() {
  // Right Panel Width
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('webster_panel_width');
    return saved ? parseInt(saved, 10) : 260;
  });

  // Layers Panel Height
  const [layersHeight, setLayersHeight] = useState<number>(() => {
    const saved = localStorage.getItem('webster_layers_height');
    return saved ? parseInt(saved, 10) : 340;
  });

  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('webster_panel_width', rightPanelWidth.toString());
  }, [rightPanelWidth]);

  useEffect(() => {
    localStorage.setItem('webster_layers_height', layersHeight.toString());
  }, [layersHeight]);

  // Resizing logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingWidth) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 180 && newWidth < 600) setRightPanelWidth(newWidth);
      }
      if (isResizingHeight) {
        const panelBody = document.querySelector('.editor-right-panel');
        if (panelBody) {
          const rect = panelBody.getBoundingClientRect();
          const relativeY = e.clientY - rect.top;
          if (relativeY > 100 && relativeY < rect.height - 100) setLayersHeight(relativeY);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingWidth(false);
      setIsResizingHeight(false);
      document.body.style.cursor = 'default';
    };

    if (isResizingWidth || isResizingHeight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingWidth, isResizingHeight]);

  return {
    rightPanelWidth,
    layersHeight,
    isResizingWidth,
    isResizingHeight,
    setIsResizingWidth,
    setIsResizingHeight,
  };
}
