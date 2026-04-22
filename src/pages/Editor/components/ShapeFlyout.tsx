import React, { useCallback, useRef, useState } from 'react';
import { SHAPE_DEFS } from '../Editor.constants';
import type { ShapeType } from '../Editor.constants';

interface ShapeFlyoutProps {
  activeShape: ShapeType;
  onSelect: (shapeType: ShapeType) => void;
}

export const ShapeFlyout: React.FC<ShapeFlyoutProps> = ({ activeShape, onSelect }) => {
  return (
    <div className="shape-flyout">
      {SHAPE_DEFS.map(({ type, label, Icon }) => (
        <button
          key={type}
          className={`shape-flyout-btn${activeShape === type ? ' active' : ''}`}
          title={label}
          onClick={() => onSelect(type)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};
