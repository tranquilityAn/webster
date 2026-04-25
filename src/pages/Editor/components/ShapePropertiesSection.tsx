import React, { useState } from 'react';
import { ColorPickerRow } from './ColorPickerRow';
import { PropertySlider } from './PropertySlider';
import { PropertyInput } from './PropertyInput';
import { DEFAULT_COLORS } from './LinePropertiesSection';
import { IconChevronDown, IconDash } from './EditorIcons';

interface ShapePropertiesSectionProps {
  type?: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  
  // Dimensions
  width?: number;
  height?: number;
  radius?: number;
  innerRadius?: number;
  outerRadius?: number;
  numPoints?: number;
  sides?: number;
  points?: number[];
  dash?: number[];
  rotation?: number;

  // Arrow specific
  pointerLength?: number;
  pointerWidth?: number;
  pointerAtBeginning?: boolean;
  pointerAtEnding?: boolean;

  // Shadow
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;

  recentColors: string[];
  onChange: (updates: Partial<{
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    width: number;
    height: number;
    radius: number;
    innerRadius: number;
    outerRadius: number;
    numPoints: number;
    sides: number;
    points: number[];
    dash: number[];
    rotation: number;
    pointerLength: number;
    pointerWidth: number;
    pointerAtBeginning: boolean;
    pointerAtEnding: boolean;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    shadowOpacity: number;
  }>) => void;
}

export const ShapePropertiesSection: React.FC<ShapePropertiesSectionProps> = ({
  type,
  fill,
  stroke,
  strokeWidth,
  opacity,
  width = 0,
  height = 0,
  radius = 0,
  innerRadius = 0,
  outerRadius = 0,
  numPoints = 5,
  sides = 6,
  points = [],
  dash = [],
  rotation = 0,
  pointerLength = 10,
  pointerWidth = 10,
  pointerAtBeginning = false,
  pointerAtEnding = true,
  shadowColor = '#000000',
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
  shadowOpacity = 1,
  recentColors,
  onChange,
}) => {
  const [isShadowExpanded, setIsShadowExpanded] = useState(false);
  const isDashed = dash && dash.length >= 2;
  
  // Calculate length for line/arrow
  const currentLength = React.useMemo(() => {
    if ((type === 'Line' || type === 'Arrow') && points.length >= 4) {
      const [x1, y1, x2, y2] = points;
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    return 0;
  }, [type, points]);

  const handleLengthChange = (newLen: number) => {
    if (points.length < 4) return;
    const [x1, y1, x2, y2] = points;
    const len = currentLength || 1; // avoid division by zero
    const ratio = newLen / len;
    
    const newPoints = [
      x1,
      y1,
      x1 + (x2 - x1) * ratio,
      y1 + (y2 - y1) * ratio
    ];
    onChange({ points: newPoints });
  };

  return (
    <div className="draw-props">
      {/* Dimensions Section */}
      {(type === 'Rect' || type === 'Circle' || type === 'RegularPolygon' || type === 'Star' || type === 'Line' || type === 'Arrow') && (
        <div className="draw-prop-grid">
          {type === 'Rect' && (
            <>
              <PropertyInput
                label="Width"
                value={width}
                onChange={(v) => onChange({ width: v })}
              />
              <PropertyInput
                label="Height"
                value={height}
                onChange={(v) => onChange({ height: v })}
              />
            </>
          )}
          {type === 'Circle' && (
            <PropertyInput
              label="Radius"
              value={radius}
              onChange={(v) => onChange({ radius: v })}
            />
          )}
          {type === 'RegularPolygon' && (
            <>
              <PropertyInput
                label="Radius"
                value={radius}
                onChange={(v) => onChange({ radius: v })}
              />
              <PropertyInput
                label="Sides"
                value={sides}
                onChange={(v) => onChange({ sides: Math.max(3, v) })}
              />
            </>
          )}
          {type === 'Star' && (
            <>
              <PropertyInput
                label="Outer R"
                value={outerRadius}
                onChange={(v) => onChange({ outerRadius: v })}
              />
              <PropertyInput
                label="Inner R"
                value={innerRadius}
                onChange={(v) => onChange({ innerRadius: v })}
              />
              <PropertyInput
                label="Points"
                value={numPoints}
                onChange={(v) => onChange({ numPoints: Math.max(3, v) })}
              />
            </>
          )}
          {(type === 'Line' || type === 'Arrow') && (
            <PropertyInput
              label="Length"
              value={currentLength}
              onChange={handleLengthChange}
            />
          )}
          
          <PropertyInput
            label="Rotation"
            value={Math.round(rotation)}
            onChange={(v) => onChange({ rotation: v })}
            unit="°"
          />

          {type === 'Arrow' && (
            <div className="draw-prop-group" style={{ gridColumn: 'span 2', marginTop: 8 }}>
              <label className="draw-prop-label">Head Positions</label>
              <div className="draw-prop-grid" style={{ marginTop: 8, gridTemplateColumns: '1fr 1fr' }}>
                <button 
                  className={`toolbar-btn ${pointerAtBeginning ? 'active' : ''}`}
                  onClick={() => onChange({ pointerAtBeginning: !pointerAtBeginning })}
                  style={{ height: 32, borderRadius: 8, fontSize: '12px' }}
                >
                  Start
                </button>
                <button 
                  className={`toolbar-btn ${pointerAtEnding ? 'active' : ''}`}
                  onClick={() => onChange({ pointerAtEnding: !pointerAtEnding })}
                  style={{ height: 32, borderRadius: 8, fontSize: '12px' }}
                >
                  End
                </button>
              </div>
              <div className="draw-prop-grid" style={{ marginTop: 12 }}>
                <PropertyInput
                  label="Head L"
                  value={pointerLength}
                  onChange={(v) => onChange({ pointerLength: v })}
                />
                <PropertyInput
                  label="Head W"
                  value={pointerWidth}
                  onChange={(v) => onChange({ pointerWidth: v })}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <ColorPickerRow
        label="Fill"
        color={fill}
        onChange={(c) => onChange({ fill: c })}
        defaultColors={DEFAULT_COLORS}
        recentColors={recentColors}
      />

      <ColorPickerRow
        label="Stroke"
        color={stroke}
        onChange={(c) => onChange({ stroke: c })}
        defaultColors={DEFAULT_COLORS}
        recentColors={recentColors}
      />

      <PropertySlider
        label="Stroke Width"
        value={strokeWidth}
        min={0}
        max={40}
        unit="px"
        marks={['0', '20', '40']}
        onChange={(v) => onChange({ strokeWidth: v })}
      />

      {/* Dash Section */}
      <div className="draw-prop-group">
        <div className="draw-prop-header">
          <label className="draw-prop-label" style={{ marginBottom: 0 }}>Dashed</label>
          <button 
            className={`toolbar-btn ${isDashed ? 'active' : ''}`}
            onClick={() => onChange({ dash: isDashed ? [] : [10, 5] })}
            style={{ width: 26, height: 26, borderRadius: 8, padding: 0 }}
            title={isDashed ? 'Remove dash' : 'Add dash'}
          >
            <IconDash />
          </button>
        </div>
        {isDashed && (
          <div className="draw-prop-grid" style={{ marginTop: 10 }}>
            <PropertyInput
              label="Length"
              value={dash[0]}
              onChange={(v) => onChange({ dash: [v, dash[1]] })}
            />
            <PropertyInput
              label="Gap"
              value={dash[1]}
              onChange={(v) => onChange({ dash: [dash[0], v] })}
            />
          </div>
        )}
      </div>

      <PropertySlider
        label="Opacity"
        value={Math.round(opacity * 100)}
        min={0}
        max={100}
        unit="%"
        marks={['0%', '50%', '100%']}
        onChange={(v) => onChange({ opacity: v / 100 })}
      />

      {/* Shadow Section */}
      <ColorPickerRow
        label="Shadow"
        color={shadowColor}
        onChange={(c) => onChange({ shadowColor: c })}
        defaultColors={['#000000', '#333333', '#666666', '#999999']}
        recentColors={recentColors}
      >
        <div style={{ marginTop: 12 }}>
          <PropertySlider
            label="Blur"
            value={shadowBlur}
            min={0}
            max={50}
            unit="px"
            onChange={(v) => onChange({ shadowBlur: v })}
          />

          <div className="draw-prop-grid">
            <PropertySlider
              label="Offset X"
              value={shadowOffsetX}
              min={-50}
              max={50}
              unit="px"
              onChange={(v) => onChange({ shadowOffsetX: v })}
            />
            <PropertySlider
              label="Offset Y"
              value={shadowOffsetY}
              min={-50}
              max={50}
              unit="px"
              onChange={(v) => onChange({ shadowOffsetY: v })}
            />
          </div>

          <PropertySlider
            label="Shadow Opacity"
            value={Math.round(shadowOpacity * 100)}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => onChange({ shadowOpacity: v / 100 })}
          />
        </div>
      </ColorPickerRow>
    </div>
  );
};
