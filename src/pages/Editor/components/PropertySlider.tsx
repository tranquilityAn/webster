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
  const roundedValue = typeof value === 'number' && !isNaN(value) ? Math.round(value) : min;

  return (
    <div className={`draw-prop-group ${className}`} style={style}>
      <div className="draw-prop-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="draw-prop-label" style={{ marginBottom: 0 }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={roundedValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val)) {
                  onChange(Math.min(max, Math.max(min, val)));
                }
              }}
              style={{
                width: '58px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 500,
                padding: '2px 16px 2px 4px',
                textAlign: 'right',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div className="custom-stepper" style={{
              position: 'absolute',
              right: '4px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '1px',
              height: '100%',
            }}>
              <button 
                type="button"
                onClick={() => onChange(Math.min(max, roundedValue + step))}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#EDE986',
                  fontSize: '7px',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ▲
              </button>
              <button 
                type="button"
                onClick={() => onChange(Math.max(min, roundedValue - step))}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#EDE986',
                  fontSize: '7px',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ▼
              </button>
            </div>
          </div>
          {unit && <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', minWidth: '12px' }}>{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={roundedValue}
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

