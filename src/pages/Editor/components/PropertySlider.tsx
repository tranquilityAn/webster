import React from 'react';

interface PropertySliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  marks?: string[];
  onChange: (val: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const PropertySlider: React.FC<PropertySliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  marks,
  onChange,
  className = '',
  style,
}) => {
  return (
    <div className={`draw-prop-group ${className}`} style={style}>
      <div className="draw-prop-header">
        <label className="draw-prop-label">{label}</label>
        <span className="draw-prop-val">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="draw-slider"
      />
      {marks && (
        <div className="draw-slider-marks">
          {marks.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      )}
    </div>
  );
};
