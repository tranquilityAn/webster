import React from 'react';
import { ColorPickerRow } from './ColorPickerRow';
import { PropertySlider } from './PropertySlider';
import { PropertyInput } from './PropertyInput';
import { IconDash } from './EditorIcons';

export const DEFAULT_COLORS = [
  '#FFFFFF', // White
  '#1A1A1A', // Dark
  '#FF6B6B', // Red
  '#FF9F45', // Orange
  '#EDE986', // Primary Accent (Yellow)
  '#6BCB77', // Green
  '#4D96FF', // Blue
  '#A29BFE', // Purple
];

export const LINE_CAP_OPTIONS = [
  { value: 'round',  label: 'Round'  },
  { value: 'square', label: 'Square' },
  { value: 'butt',   label: 'Flat'   },
];

interface LinePropertiesSectionProps {
  color: string;
  width: number;
  opacity: number;
  lineCap: string;
  tension: number;
  dash?: number[];
  recentColors: string[];
  onChange: (updates: any) => void;
  showPreview?: boolean;
}

export const LinePropertiesSection: React.FC<LinePropertiesSectionProps> = ({
  color,
  width,
  opacity,
  lineCap,
  tension,
  dash = [],
  recentColors,
  onChange,
  showPreview = false,
}) => {
  const isDashed = dash && dash.length >= 2;

  return (
    <div className="draw-props">
      {/* Color */}
      <ColorPickerRow
        label="Stroke Color"
        color={color}
        onChange={(c) => onChange({ stroke: c })}
        defaultColors={DEFAULT_COLORS}
        recentColors={recentColors}
      />

      {/* Width */}
      <PropertySlider
        label="Width"
        value={width}
        min={1}
        max={80}
        unit="px"
        marks={['1', '40', '80']}
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

      {/* Opacity */}
      <PropertySlider
        label="Opacity"
        value={Math.round(opacity * 100)}
        min={0}
        max={100}
        unit="%"
        marks={['0%', '50%', '100%']}
        onChange={(v) => onChange({ opacity: v / 100 })}
        style={{ '--slider-color': color } as React.CSSProperties}
        className="opacity-slider-wrap"
      />

      {/* Line Cap */}
      <div className="draw-prop-group">
        <label className="draw-prop-label">Line Cap</label>
        <div className="linecap-options">
          {LINE_CAP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`linecap-btn${lineCap === opt.value ? ' active' : ''}`}
              onClick={() =>
                onChange({
                  lineCap: opt.value,
                  lineJoin: opt.value === 'round' ? 'round' : 'miter',
                })
              }
              title={opt.label}
            >
              <span className={`linecap-preview linecap-${opt.value}`} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tension */}
      <PropertySlider
        label="Smoothness"
        value={Math.round(tension * 100)}
        min={0}
        max={100}
        unit="%"
        marks={['Sharp', 'Smooth']}
        onChange={(v) => onChange({ tension: v / 100 })}
      />

      {/* Preview */}
      {showPreview && (
        <div className="draw-prop-group">
          <label className="draw-prop-label">Preview</label>
          <div className="brush-preview-wrap">
            <svg width="100%" height="44" viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10 22 Q 50 8, 100 22 T 190 22"
                fill="none"
                stroke={color}
                strokeWidth={Math.min(width, 30)}
                strokeLinecap={lineCap as any}
                strokeLinejoin={lineCap === 'round' ? 'round' : 'miter'}
                strokeDasharray={dash.join(',')}
                opacity={opacity}
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
