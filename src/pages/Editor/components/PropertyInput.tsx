import React from 'react';

interface PropertyInputProps {
  label: string;
  value: number;
  unit?: string;
  onChange: (val: number) => void;
  className?: string;
}

export const PropertyInput: React.FC<PropertyInputProps> = ({
  label,
  value,
  unit = 'px',
  onChange,
  className = '',
}) => {
  return (
    <div className={`draw-prop-group ${className}`}>
      <div className="draw-prop-header">
        <label className="draw-prop-label">{label}</label>
      </div>
      <div className="draw-input-wrapper">
        <input
          type="number"
          className="draw-num-input"
          value={Math.round(value)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="draw-input-unit">{unit}</span>
      </div>
    </div>
  );
};
