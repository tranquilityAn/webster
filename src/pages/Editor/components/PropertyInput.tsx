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
  const roundedValue = typeof value === 'number' && !isNaN(value) ? Math.round(value) : '';

  return (
    <div className={`draw-prop-group ${className}`}>
      <div className="draw-prop-header">
        <label className="draw-prop-label">{label}</label>
      </div>
      <div className="draw-input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
          <input
            type="number"
            className="draw-num-input"
            value={roundedValue}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ width: '100%', paddingRight: '16px' }}
          />
          <div className="custom-stepper" style={{
            position: 'absolute',
            right: '2px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '2px',
          }}>
            <button 
              type="button"
              onClick={() => onChange((Number(value) || 0) + 1)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: '#EDE986',
                fontSize: '8px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '8px',
              }}
            >
              ▲
            </button>
            <button 
              type="button"
              onClick={() => onChange(Math.max(0, (Number(value) || 0) - 1))}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: '#EDE986',
                fontSize: '8px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '8px',
              }}
            >
              ▼
            </button>
          </div>
        </div>
        <span className="draw-input-unit" style={{ marginLeft: '6px' }}>{unit}</span>
      </div>
    </div>
  );
};

