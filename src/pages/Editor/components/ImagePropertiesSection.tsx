import React, { useState } from 'react';
import { PropertySlider } from './PropertySlider';
import { PropertyInput } from './PropertyInput';
import { IconChevronDown } from './EditorIcons';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImageAttrs {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  // Konva filter attrs
  brightness?: number;     // -1..1  → Konva.Filters.Brighten
  contrast?: number;       // -100..100 → Konva.Filters.Contrast
  saturation?: number;     // -2..10 → Konva.Filters.HSL
  hue?: number;            // 0..259 → Konva.Filters.HSL
  luminance?: number;      // -2..2 → Konva.Filters.HSL
  blurRadius?: number;     // 0..40 → Konva.Filters.Blur
  // Shadow
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  // Active filter list (managed here, written as string[] to the node)
  filters?: string[];
}

interface ImagePropertiesSectionProps {
  attrs: ImageAttrs;
  onChange: (updates: Partial<ImageAttrs>) => void;
}

// ── Collapsible section wrapper ───────────────────────────────────────────────

const CollapsibleSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="draw-prop-group">
      <div className="draw-prop-header" style={{ cursor: 'pointer' }} onClick={() => setOpen((p) => !p)}>
        <label className="draw-prop-label" style={{ marginBottom: 0, cursor: 'pointer' }}>{title}</label>
        <button className={`expand-btn ${open ? 'active' : ''}`} style={{ marginLeft: 'auto' }}>
          <IconChevronDown />
        </button>
      </div>
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
};

// ── Effect presets ────────────────────────────────────────────────────────────

interface EffectPreset {
  label: string;
  attrs: Partial<ImageAttrs>;
}

const EFFECT_PRESETS: EffectPreset[] = [
  {
    label: 'Original',
    attrs: { brightness: 0, contrast: 0, saturation: 0, hue: 0, luminance: 0, blurRadius: 0, filters: [] },
  },
  {
    label: 'Grayscale',
    attrs: { saturation: -2, brightness: 0, contrast: 0, hue: 0, luminance: 0, blurRadius: 0, filters: ['Grayscale'] },
  },
  {
    label: 'Sepia',
    attrs: { saturation: -1.5, hue: 30, brightness: 0.05, contrast: 10, luminance: 0, blurRadius: 0, filters: ['HSL', 'Brighten', 'Contrast'] },
  },
  {
    label: 'Vivid',
    attrs: { saturation: 2, contrast: 20, brightness: 0.05, hue: 0, luminance: 0, blurRadius: 0, filters: ['HSL', 'Brighten', 'Contrast'] },
  },
  {
    label: 'Cool',
    attrs: { hue: 200, saturation: 0.5, brightness: 0, contrast: 0, luminance: 0, blurRadius: 0, filters: ['HSL'] },
  },
  {
    label: 'Warm',
    attrs: { hue: 20, saturation: 1, brightness: 0.05, contrast: 5, luminance: 0, blurRadius: 0, filters: ['HSL', 'Brighten', 'Contrast'] },
  },
  {
    label: 'Fade',
    attrs: { brightness: 0.15, contrast: -20, saturation: -0.5, hue: 0, luminance: 0, blurRadius: 0, filters: ['Brighten', 'Contrast', 'HSL'] },
  },
  {
    label: 'Blur',
    attrs: { blurRadius: 8, brightness: 0, contrast: 0, saturation: 0, hue: 0, luminance: 0, filters: ['Blur'] },
  },
];

// Helper: given current attrs, compute which Konva filters should be active
function computeFilters(attrs: ImageAttrs): string[] {
  const filters: string[] = [];
  if ((attrs.brightness ?? 0) !== 0) filters.push('Brighten');
  if ((attrs.contrast ?? 0) !== 0) filters.push('Contrast');
  if (
    (attrs.saturation ?? 0) !== 0 ||
    (attrs.hue ?? 0) !== 0 ||
    (attrs.luminance ?? 0) !== 0
  ) filters.push('HSL');
  if ((attrs.blurRadius ?? 0) > 0) filters.push('Blur');
  // Grayscale is special – only added when saturation is fully negative without other HSL modifiers
  return [...new Set(filters)];
}

// ── Main Component ─────────────────────────────────────────────────────────────

export const ImagePropertiesSection: React.FC<ImagePropertiesSectionProps> = ({
  attrs,
  onChange,
}) => {
  const {
    width = 0,
    height = 0,
    rotation = 0,
    opacity = 1,
    brightness = 0,
    contrast = 0,
    saturation = 0,
    hue = 0,
    luminance = 0,
    blurRadius = 0,
    shadowColor = '#000000',
    shadowBlur = 0,
    shadowOffsetX = 0,
    shadowOffsetY = 0,
    shadowOpacity = 1,
  } = attrs;

  // Wraps onChange to also recompute filters
  const update = (partial: Partial<ImageAttrs>) => {
    const merged = { ...attrs, ...partial };
    // Only recompute filters if not explicitly set in partial (preset sets filters directly)
    const newFilters = partial.filters !== undefined ? partial.filters : computeFilters(merged);
    onChange({ ...partial, filters: newFilters });
  };

  return (
    <div className="draw-props">

      {/* ── Dimensions ──────────────────────────────────────────────────────── */}
      <div className="draw-prop-grid">
        <PropertyInput
          label="Width"
          value={width}
          onChange={(v) => update({ width: Math.max(1, v) })}
        />
        <PropertyInput
          label="Height"
          value={height}
          onChange={(v) => update({ height: Math.max(1, v) })}
        />
        <PropertyInput
          label="Rotation"
          value={Math.round(rotation)}
          unit="°"
          onChange={(v) => update({ rotation: v })}
        />
        <PropertyInput
          label="X"
          value={Math.round(attrs.x ?? 0)}
          onChange={(v) => update({ x: v })}
        />
        <PropertyInput
          label="Y"
          value={Math.round(attrs.y ?? 0)}
          onChange={(v) => update({ y: v })}
        />
      </div>

      {/* ── Opacity ─────────────────────────────────────────────────────────── */}
      <PropertySlider
        label="Opacity"
        value={Math.round(opacity * 100)}
        min={0}
        max={100}
        unit="%"
        marks={['0%', '50%', '100%']}
        onChange={(v) => update({ opacity: v / 100 })}
      />

      {/* ── Colour Adjustments ──────────────────────────────────────────────── */}
      <CollapsibleSection title="Colour" defaultOpen>
        <PropertySlider
          label="Brightness"
          value={Math.round(brightness * 100)}
          min={-100}
          max={100}
          unit=""
          marks={['-100', '0', '+100']}
          onChange={(v) => update({ brightness: v / 100 })}
        />
        <PropertySlider
          label="Contrast"
          value={Math.round(contrast)}
          min={-100}
          max={100}
          unit=""
          marks={['-100', '0', '+100']}
          onChange={(v) => update({ contrast: v })}
        />
        <PropertySlider
          label="Saturation"
          value={Math.round(saturation * 50)}   // map -2..2 → -100..100
          min={-100}
          max={100}
          unit=""
          marks={['-100', '0', '+100']}
          onChange={(v) => update({ saturation: v / 50 })}
        />
        <PropertySlider
          label="Hue"
          value={Math.round(hue)}
          min={0}
          max={259}
          unit="°"
          marks={['0', '130', '259']}
          onChange={(v) => update({ hue: v })}
        />
        <PropertySlider
          label="Luminance"
          value={Math.round(luminance * 50)}    // map -2..2 → -100..100
          min={-100}
          max={100}
          unit=""
          marks={['-100', '0', '+100']}
          onChange={(v) => update({ luminance: v / 50 })}
        />
      </CollapsibleSection>

      {/* ── Blur ────────────────────────────────────────────────────────────── */}
      <PropertySlider
        label="Blur"
        value={Math.round(blurRadius)}
        min={0}
        max={40}
        unit="px"
        marks={['0', '20', '40']}
        onChange={(v) => update({ blurRadius: v })}
      />

      {/* ── Effects (presets) ───────────────────────────────────────────────── */}
      <CollapsibleSection title="Effects">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
        }}>
          {EFFECT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => update(preset.attrs)}
              style={{
                padding: '7px 6px',
                background: '#1E1E1E',
                border: '1.5px solid #333',
                borderRadius: '8px',
                color: '#A0A0A0',
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(237,233,134,0.5)';
                (e.currentTarget as HTMLButtonElement).style.color = '#EDE986';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(237,233,134,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#333';
                (e.currentTarget as HTMLButtonElement).style.color = '#A0A0A0';
                (e.currentTarget as HTMLButtonElement).style.background = '#1E1E1E';
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* ── Shadow ──────────────────────────────────────────────────────────── */}
      <CollapsibleSection title="Shadow">
        <div className="draw-color-row" style={{ marginBottom: 10 }}>
          <div className="color-swatch-wrapper">
            <input
              type="color"
              value={shadowColor}
              onChange={(e) => update({ shadowColor: e.target.value })}
              className="color-input"
            />
            <div className="color-swatch" style={{ backgroundColor: shadowColor }} />
          </div>
          <span className="draw-prop-value-label">{shadowColor.toUpperCase()}</span>
        </div>
        <PropertySlider
          label="Blur"
          value={shadowBlur}
          min={0}
          max={50}
          unit="px"
          onChange={(v) => update({ shadowBlur: v })}
        />
        <div className="draw-prop-grid">
          <PropertySlider
            label="Offset X"
            value={shadowOffsetX}
            min={-50}
            max={50}
            unit="px"
            onChange={(v) => update({ shadowOffsetX: v })}
          />
          <PropertySlider
            label="Offset Y"
            value={shadowOffsetY}
            min={-50}
            max={50}
            unit="px"
            onChange={(v) => update({ shadowOffsetY: v })}
          />
        </div>
        <PropertySlider
          label="Shadow Opacity"
          value={Math.round(shadowOpacity * 100)}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => update({ shadowOpacity: v / 100 })}
        />
      </CollapsibleSection>

    </div>
  );
};
