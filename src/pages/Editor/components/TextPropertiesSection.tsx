import React from 'react';
import { ColorPickerRow } from './ColorPickerRow';
import { PropertySlider } from './PropertySlider';
import { PropertyInput } from './PropertyInput';
import { DEFAULT_COLORS } from './LinePropertiesSection';

// ──────────────────────────────────────────────────────────────────────────────
// Font families available in the picker (all loaded via Google Fonts in index.html)
// ──────────────────────────────────────────────────────────────────────────────
export const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Outfit',
  'Playfair Display',
  'Montserrat',
  'Lato',
  'Oswald',
  'Raleway',
  'Merriweather',
  'Source Code Pro',
  'Georgia',
  'Arial',
  'Verdana',
  'Times New Roman',
  'Courier New',
];

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
export interface TextAttrs {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  opacity?: number;
  align?: 'left' | 'center' | 'right';
  fontStyle?: string;          // 'normal' | 'bold' | 'italic' | 'bold italic'
  textDecoration?: string;     // '' | 'underline' | 'line-through' | 'underline line-through'
  letterSpacing?: number;
  lineHeight?: number;
  rotation?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  width?: number | 'auto';
  height?: number | 'auto';
  wrap?: 'word' | 'char' | 'none';
  padding?: number;
  stroke?: string;
  strokeWidth?: number;
}

interface TextPropertiesSectionProps extends TextAttrs {
  recentColors: string[];
  onChange: (updates: Partial<TextAttrs>) => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function toggleFontStyleToken(current: string, token: 'bold' | 'italic'): string {
  const hasBold   = current.includes('bold');
  const hasItalic = current.includes('italic');

  const nextBold   = token === 'bold'   ? !hasBold   : hasBold;
  const nextItalic = token === 'italic' ? !hasItalic : hasItalic;

  if (nextBold && nextItalic) return 'bold italic';
  if (nextBold)               return 'bold';
  if (nextItalic)             return 'italic';
  return 'normal';
}

function toggleDecoration(current: string, token: 'underline' | 'line-through'): string {
  const parts = current ? current.split(' ').filter(Boolean) : [];
  const has = parts.includes(token);
  if (has) return parts.filter(p => p !== token).join(' ');
  return [...parts, token].join(' ');
}

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────
export const TextPropertiesSection: React.FC<TextPropertiesSectionProps> = ({
  fontSize       = 32,
  fontFamily     = 'Inter',
  fill           = '#1A1A1A',
  opacity        = 1,
  align          = 'left',
  fontStyle      = 'normal',
  textDecoration = '',
  letterSpacing  = 0,
  lineHeight     = 1.2,
  rotation       = 0,
  shadowColor    = '#000000',
  shadowBlur     = 0,
  shadowOffsetX  = 0,
  shadowOffsetY  = 0,
  shadowOpacity  = 1,
  width          = 'auto',
  height         = 'auto',
  wrap           = 'word',
  padding        = 0,
  stroke         = '#ffffff',
  strokeWidth    = 0,
  recentColors,
  onChange,
}) => {
  const isBold        = fontStyle.includes('bold');
  const isItalic      = fontStyle.includes('italic');
  const isUnderline   = textDecoration.includes('underline');
  const isStrike      = textDecoration.includes('line-through');

  const normalizedWidth  = (width === 'auto' || width === null || width === undefined) ? 'auto' : width;
  const normalizedHeight = (height === 'auto' || height === null || height === undefined) ? 'auto' : height;

  return (
    <div className="draw-props">

      {/* ── Font Family ── */}
      <div className="draw-prop-group">
        <label className="draw-prop-label">Font Family</label>
        <select
          className="font-select"
          value={fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* ── Font Size ── */}
      <PropertySlider
        label="Font Size"
        value={fontSize}
        min={8}
        max={200}
        unit="px"
        marks={['8', '100', '200']}
        onChange={(v) => onChange({ fontSize: v })}
      />

      {/* ── Style buttons: Bold / Italic / Underline / Strikethrough ── */}
      <div className="draw-prop-group">
        <label className="draw-prop-label">Style</label>
        <div className="text-style-btns">
          <button
            className={`text-style-btn${isBold ? ' active' : ''}`}
            title="Bold"
            onClick={() => onChange({ fontStyle: toggleFontStyleToken(fontStyle, 'bold') })}
          >
            <span style={{ fontWeight: 700 }}>B</span>
          </button>
          <button
            className={`text-style-btn${isItalic ? ' active' : ''}`}
            title="Italic"
            onClick={() => onChange({ fontStyle: toggleFontStyleToken(fontStyle, 'italic') })}
          >
            <span style={{ fontStyle: 'italic' }}>I</span>
          </button>
          <button
            className={`text-style-btn${isUnderline ? ' active' : ''}`}
            title="Underline"
            onClick={() => onChange({ textDecoration: toggleDecoration(textDecoration, 'underline') })}
          >
            <span style={{ textDecoration: 'underline' }}>U</span>
          </button>
          <button
            className={`text-style-btn${isStrike ? ' active' : ''}`}
            title="Strikethrough"
            onClick={() => onChange({ textDecoration: toggleDecoration(textDecoration, 'line-through') })}
          >
            <span style={{ textDecoration: 'line-through' }}>S</span>
          </button>
        </div>
      </div>

      {/* ── Alignment ── */}
      <div className="draw-prop-group">
        <label className="draw-prop-label">Alignment</label>
        <div className="text-align-btns">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              className={`text-align-btn${align === a ? ' active' : ''}`}
              title={`Align ${a}`}
              onClick={() => onChange({ align: a })}
            >
              <AlignIcon type={a} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Color ── */}
      <ColorPickerRow
        label="Color"
        color={fill}
        onChange={(c) => onChange({ fill: c })}
        defaultColors={DEFAULT_COLORS}
        recentColors={recentColors}
      />

      {/* ── Opacity ── */}
      <PropertySlider
        label="Opacity"
        value={Math.round(opacity * 100)}
        min={0}
        max={100}
        unit="%"
        marks={['0%', '50%', '100%']}
        onChange={(v) => onChange({ opacity: v / 100 })}
      />

      {/* ── Letter Outline (Stroke) ── */}
      <ColorPickerRow
        label="Letter Outline"
        color={stroke}
        onChange={(c) => onChange({ stroke: c })}
        defaultColors={['#ffffff', '#000000', '#EDE986', '#4D96FF']}
        recentColors={recentColors}
      >
        <div style={{ marginTop: 12 }}>
          <PropertySlider
            label="Outline Thickness"
            value={strokeWidth}
            min={0}
            max={20}
            unit="px"
            onChange={(v) => onChange({ strokeWidth: v })}
          />
        </div>
      </ColorPickerRow>

      {/* ── Block Size (Width & Height) ── */}
      <div className="draw-prop-group">
        <label className="draw-prop-label">Block Size</label>
        <div className="draw-prop-grid" style={{ gap: '12px', marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: '11px', color: '#888' }}>Width Mode</span>
            <div className="text-style-btns" style={{ marginTop: 4 }}>
              <button
                type="button"
                className={`text-style-btn${normalizedWidth === 'auto' ? ' active' : ''}`}
                style={{ flex: 1, fontSize: '11px', height: '28px' }}
                onClick={() => onChange({ width: 'auto' })}
              >
                Auto
              </button>
              <button
                type="button"
                className={`text-style-btn${normalizedWidth !== 'auto' ? ' active' : ''}`}
                style={{ flex: 1, fontSize: '11px', height: '28px' }}
                onClick={() => onChange({ width: typeof width === 'number' ? width : 200 })}
              >
                Fixed
              </button>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#888' }}>Height Mode</span>
            <div className="text-style-btns" style={{ marginTop: 4 }}>
              <button
                type="button"
                className={`text-style-btn${normalizedHeight === 'auto' ? ' active' : ''}`}
                style={{ flex: 1, fontSize: '11px', height: '28px' }}
                onClick={() => onChange({ height: 'auto' })}
              >
                Auto
              </button>
              <button
                type="button"
                className={`text-style-btn${normalizedHeight !== 'auto' ? ' active' : ''}`}
                style={{ flex: 1, fontSize: '11px', height: '28px' }}
                onClick={() => onChange({ height: typeof height === 'number' ? height : 100 })}
              >
                Fixed
              </button>
            </div>
          </div>
        </div>
        {normalizedWidth !== 'auto' && (
          <PropertySlider
            label="Width"
            value={typeof width === 'number' ? width : 200}
            min={50}
            max={2000}
            unit="px"
            onChange={(v) => onChange({ width: v })}
          />
        )}
        {normalizedHeight !== 'auto' && (
          <PropertySlider
            label="Height"
            value={typeof height === 'number' ? height : 100}
            min={20}
            max={2000}
            unit="px"
            onChange={(v) => onChange({ height: v })}
          />
        )}
      </div>

      {/* ── Text Wrap Mode ── */}
      <div className="draw-prop-group">
        <label className="draw-prop-label">Text Wrap</label>
        <div className="text-style-btns">
          {(['word', 'char', 'none'] as const).map((w) => (
            <button
              key={w}
              type="button"
              className={`text-style-btn${wrap === w ? ' active' : ''}`}
              style={{ flex: 1, fontSize: '11px', textTransform: 'capitalize' }}
              onClick={() => onChange({ wrap: w })}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* ── Padding ── */}
      <PropertySlider
        label="Padding"
        value={padding}
        min={0}
        max={100}
        unit="px"
        onChange={(v) => onChange({ padding: v })}
      />

      {/* ── Dimensions ── */}
      <div className="draw-prop-grid">
        <PropertyInput
          label="Letter Spacing"
          value={letterSpacing}
          onChange={(v) => onChange({ letterSpacing: v })}
        />
        <PropertyInput
          label="Line Height"
          value={lineHeight}
          onChange={(v) => onChange({ lineHeight: Math.max(0.5, v) })}
        />
        <PropertyInput
          label="Rotation"
          value={Math.round(rotation)}
          onChange={(v) => onChange({ rotation: v })}
          unit="°"
        />
      </div>

      {/* ── Shadow ── */}
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

// ──────────────────────────────────────────────────────────────────────────────
// Inline SVG icons for alignment buttons
// ──────────────────────────────────────────────────────────────────────────────
const AlignIcon: React.FC<{ type: 'left' | 'center' | 'right' }> = ({ type }) => {
  if (type === 'left') return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="1" y1="4"  x2="15" y2="4"  />
      <line x1="1" y1="8"  x2="10" y2="8"  />
      <line x1="1" y1="12" x2="13" y2="12" />
    </svg>
  );
  if (type === 'center') return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="1" y1="4"  x2="15" y2="4"  />
      <line x1="3" y1="8"  x2="13" y2="8"  />
      <line x1="2" y1="12" x2="14" y2="12" />
    </svg>
  );
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="1"  y1="4"  x2="15" y2="4"  />
      <line x1="6"  y1="8"  x2="15" y2="8"  />
      <line x1="3"  y1="12" x2="15" y2="12" />
    </svg>
  );
};
