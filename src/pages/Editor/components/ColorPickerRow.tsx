import React, { useState } from 'react';
import { IconChevronDown } from './EditorIcons';

interface ColorPickerRowProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  defaultColors: string[];
  recentColors?: string[];
  children?: React.ReactNode;
}

export const ColorPickerRow: React.FC<ColorPickerRowProps> = ({
  label,
  color,
  onChange,
  defaultColors,
  recentColors = [],
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="draw-prop-group">
      <label className="draw-prop-label">{label}</label>
      <div className="draw-color-row">
        <div className="color-swatch-wrapper">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="color-input"
          />
          <div className="color-swatch" style={{ backgroundColor: color }} />
        </div>
        <span className="draw-prop-value-label">{color.toUpperCase()}</span>
        <button 
          className={`expand-btn ${isExpanded ? 'active' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Hide options' : 'Show options'}
        >
          <IconChevronDown />
        </button>
      </div>
      
      {isExpanded && (
        <div className="color-expandable-content">
          <div className="quick-colors-section">
            <span className="quick-colors-label">Default Palette</span>
            <div className="quick-colors">
              {defaultColors.map((c) => (
                <button
                  key={c}
                  className={`quick-color-btn${color.toUpperCase() === c.toUpperCase() ? ' active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => onChange(c)}
                  title={c}
                />
              ))}
            </div>
          </div>

          {recentColors.length > 0 && (
            <div className="quick-colors-section">
              <span className="quick-colors-label">Recent</span>
              <div className="quick-colors">
                {recentColors.map((c) => (
                  <button
                    key={`recent-${c}`}
                    className={`quick-color-btn${color.toUpperCase() === c.toUpperCase() ? ' active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => onChange(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {children}
        </div>
      )}
    </div>
  );
};
