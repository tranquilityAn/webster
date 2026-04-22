import React, { useState, useEffect, useRef } from 'react';
import { TOOLS, SHAPE_DEFS } from '../Editor.constants';
import type { ShapeType } from '../Editor.constants';
import { ShapeFlyout } from './ShapeFlyout';

interface ToolbarProps {
  activeTool: string;
  activeShape: ShapeType;
  onToolSelect: (toolId: string) => void;
  onShapeSelect: (shape: ShapeType) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  activeShape,
  onToolSelect,
  onShapeSelect,
}) => {
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  // Close flyout when clicking outside the toolbar
  useEffect(() => {
    if (!flyoutOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFlyoutOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [flyoutOpen]);

  // The icon shown in the toolbar for the shapes button is the currently-selected shape
  const activeShapeDef = SHAPE_DEFS.find(s => s.type === activeShape) ?? SHAPE_DEFS[0];
  const ShapesIcon = activeShapeDef.Icon;

  const handleToolClick = (toolId: string) => {
    if (toolId === 'shapes') {
      setFlyoutOpen(v => !v);
      // Still activate the tool so cursor/properties respond
      onToolSelect('shapes');
    } else {
      setFlyoutOpen(false);
      onToolSelect(toolId);
    }
  };

  const handleShapeSelect = (shape: ShapeType) => {
    onShapeSelect(shape);
    setFlyoutOpen(false);
    onToolSelect('shapes');
  };

  return (
    <aside className="editor-toolbar" ref={containerRef}>
      {TOOLS.map(({ id: toolId, label, Icon }, idx) => {
        const isShapes = toolId === 'shapes';
        const DisplayIcon = isShapes ? ShapesIcon : Icon;

        return (
          <React.Fragment key={toolId}>
            {idx === 2 && <div className="toolbar-separator" />}
            <button
              className={`toolbar-btn${activeTool === toolId ? ' active' : ''}`}
              title={isShapes ? `Shapes — ${activeShapeDef.label}` : label}
              onClick={() => handleToolClick(toolId)}
            >
              <DisplayIcon />
            </button>
          </React.Fragment>
        );
      })}

      {flyoutOpen && (
        <ShapeFlyout activeShape={activeShape} onSelect={handleShapeSelect} />
      )}
    </aside>
  );
};
