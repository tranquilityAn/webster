import React from 'react';
import { ColorPickerRow } from './ColorPickerRow';
import { PropertySlider } from './PropertySlider';
import { DEFAULT_COLORS } from './LinePropertiesSection';

interface ShapePropertiesSectionProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  recentColors: string[];
  onChange: (updates: Partial<{
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
  }>) => void;
}

export const ShapePropertiesSection: React.FC<ShapePropertiesSectionProps> = ({
  fill,
  stroke,
  strokeWidth,
  opacity,
  recentColors,
  onChange,
}) => {
  return (
    <div className="draw-props">
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

      <PropertySlider
        label="Opacity"
        value={Math.round(opacity * 100)}
        min={0}
        max={100}
        unit="%"
        marks={['0%', '50%', '100%']}
        onChange={(v) => onChange({ opacity: v / 100 })}
      />
    </div>
  );
};
