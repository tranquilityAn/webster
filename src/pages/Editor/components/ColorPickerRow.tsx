import React from 'react';

interface ColorPickerRowProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  defaultColors: string[];
  recentColors?: string[];
}

export const ColorPickerRow: React.FC<ColorPickerRowProps> = ({
  label,
  color,
  onChange,
  defaultColors,
  recentColors = [],
}) => {
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
      </div>
      
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
    </div>
  );
};
