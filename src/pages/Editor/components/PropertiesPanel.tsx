import React from 'react';
import { LinePropertiesSection } from './LinePropertiesSection';
import { ShapePropertiesSection } from './ShapePropertiesSection';
import { TextPropertiesSection } from './TextPropertiesSection';

export interface PropertiesPanelProps {
  activeTool: string;
  selectedNode: any;
  recentColors: string[];
  
  // Brush properties (pen tool)
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  brushLineCap: any;
  brushTension: number;
  onBrushChange: (updates: any) => void;

  // Default shape properties (shapes tool)
  shapeFill: string;
  shapeStroke: string;
  shapeStrokeWidth: number;
  shapeOpacity: number;
  shapeDash: number[];
  shapeRotation: number;
  onShapeChange: (updates: any) => void;

  // Default text properties (text tool)
  textFontSize: number;
  textFontFamily: string;
  textColor: string;
  textOpacity: number;
  textAlign: any;
  textFontStyle: string;
  textDecoration: string;
  textLetterSpacing: number;
  textLineHeight: number;
  textWidth: any;
  textHeight: any;
  textWrap: string;
  textPadding: number;
  textStroke: string;
  textStrokeWidth: number;
  onTextChange: (updates: any) => void;

  // Node modifications
  handleNodeChange: (id: string, updates: any) => void;

  // Snapshot / Canvas state
  snapshot: any;
  computedState: any;
  commits: any[];
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  activeTool,
  selectedNode,
  recentColors,
  
  brushColor,
  brushSize,
  brushOpacity,
  brushLineCap,
  brushTension,
  onBrushChange,

  shapeFill,
  shapeStroke,
  shapeStrokeWidth,
  shapeOpacity,
  shapeDash,
  shapeRotation,
  onShapeChange,

  textFontSize,
  textFontFamily,
  textColor,
  textOpacity,
  textAlign,
  textFontStyle,
  textDecoration,
  textLetterSpacing,
  textLineHeight,
  textWidth,
  textHeight,
  textWrap,
  textPadding,
  textStroke,
  textStrokeWidth,
  onTextChange,

  handleNodeChange,
  snapshot,
  computedState,
  commits,
}) => {
  return (
    <>
      {activeTool === 'pen' ? (
        <LinePropertiesSection
          color={brushColor}
          width={brushSize}
          opacity={brushOpacity}
          lineCap={brushLineCap}
          tension={brushTension}
          recentColors={recentColors}
          onChange={onBrushChange}
          showPreview
        />
      ) : activeTool === 'shapes' ? (
        <ShapePropertiesSection
          fill={shapeFill}
          stroke={shapeStroke}
          strokeWidth={shapeStrokeWidth}
          opacity={shapeOpacity}
          dash={shapeDash}
          rotation={shapeRotation}
          recentColors={recentColors}
          onChange={onShapeChange}
        />
      ) : activeTool === 'text' && !selectedNode ? (
        // Default text tool properties (used when placing new text)
        <TextPropertiesSection
          fontSize={textFontSize}
          fontFamily={textFontFamily}
          fill={textColor}
          opacity={textOpacity}
          align={textAlign}
          fontStyle={textFontStyle}
          textDecoration={textDecoration}
          letterSpacing={textLetterSpacing}
          lineHeight={textLineHeight}
          width={textWidth}
          height={textHeight}
          wrap={textWrap}
          padding={textPadding}
          stroke={textStroke}
          strokeWidth={textStrokeWidth}
          recentColors={recentColors}
          onChange={onTextChange}
        />
      ) : selectedNode && selectedNode.className === 'Text' ? (
        <TextPropertiesSection
          fontSize={selectedNode.attrs?.fontSize ?? 32}
          fontFamily={selectedNode.attrs?.fontFamily ?? 'Inter'}
          fill={selectedNode.attrs?.fill ?? '#1A1A1A'}
          opacity={selectedNode.attrs?.opacity ?? 1}
          align={selectedNode.attrs?.align ?? 'left'}
          fontStyle={selectedNode.attrs?.fontStyle ?? 'normal'}
          textDecoration={selectedNode.attrs?.textDecoration ?? ''}
          letterSpacing={selectedNode.attrs?.letterSpacing ?? 0}
          lineHeight={selectedNode.attrs?.lineHeight ?? 1.2}
          rotation={selectedNode.attrs?.rotation ?? 0}
          shadowColor={selectedNode.attrs?.shadowColor}
          shadowBlur={selectedNode.attrs?.shadowBlur}
          shadowOffsetX={selectedNode.attrs?.shadowOffsetX}
          shadowOffsetY={selectedNode.attrs?.shadowOffsetY}
          shadowOpacity={selectedNode.attrs?.shadowOpacity}
          width={selectedNode.attrs?.width ?? 'auto'}
          height={selectedNode.attrs?.height ?? 'auto'}
          wrap={selectedNode.attrs?.wrap ?? 'word'}
          padding={selectedNode.attrs?.padding ?? 0}
          stroke={selectedNode.attrs?.stroke ?? '#ffffff'}
          strokeWidth={selectedNode.attrs?.strokeWidth ?? 0}
          recentColors={recentColors}
          onChange={(u) => {
            // If a property is set to 'auto', set it to null so JSON.stringify transmits it, resetting Konva's width/height
            const updates: any = { ...u };
            if (u.width === 'auto') updates.width = null;
            if (u.height === 'auto') updates.height = null;
            handleNodeChange(selectedNode.attrs.id, updates);
          }}
        />
      ) : selectedNode && selectedNode.className === 'Line' ? (
        <LinePropertiesSection
          color={selectedNode.attrs?.stroke || '#000000'}
          width={selectedNode.attrs?.strokeWidth || 1}
          opacity={selectedNode.attrs?.opacity ?? 1}
          lineCap={selectedNode.attrs?.lineCap || 'round'}
          tension={selectedNode.attrs?.tension ?? 0}
          dash={selectedNode.attrs?.dash || []}
          rotation={selectedNode.attrs?.rotation || 0}
          recentColors={recentColors}
          onChange={(updates) => handleNodeChange(selectedNode.attrs.id, updates)}
        />
      ) : selectedNode && ['Rect', 'Circle', 'RegularPolygon', 'Star', 'Arrow'].includes(selectedNode.className) ? (
        <ShapePropertiesSection
          type={selectedNode.className}
          fill={selectedNode.attrs?.fill || '#4D96FF'}
          stroke={selectedNode.attrs?.stroke || '#1A1A1A'}
          strokeWidth={selectedNode.attrs?.strokeWidth ?? 2}
          opacity={selectedNode.attrs?.opacity ?? 1}
          dash={selectedNode.attrs?.dash || []}
          rotation={selectedNode.attrs?.rotation || 0}
          
          width={selectedNode.attrs?.width}
          height={selectedNode.attrs?.height}
          radius={selectedNode.attrs?.radius}
          innerRadius={selectedNode.attrs?.innerRadius}
          outerRadius={selectedNode.attrs?.outerRadius}
          numPoints={selectedNode.attrs?.numPoints}
          sides={selectedNode.attrs?.sides}
          points={selectedNode.attrs?.points}
          
          pointerLength={selectedNode.attrs?.pointerLength}
          pointerWidth={selectedNode.attrs?.pointerWidth}
          pointerAtBeginning={selectedNode.attrs?.pointerAtBeginning}
          pointerAtEnding={selectedNode.attrs?.pointerAtEnding}

          shadowColor={selectedNode.attrs?.shadowColor}
          shadowBlur={selectedNode.attrs?.shadowBlur}
          shadowOffsetX={selectedNode.attrs?.shadowOffsetX}
          shadowOffsetY={selectedNode.attrs?.shadowOffsetY}
          shadowOpacity={selectedNode.attrs?.shadowOpacity}

          recentColors={recentColors}
          onChange={(updates) => handleNodeChange(selectedNode.attrs.id, updates)}
        />
      ) : snapshot ? (
        <>
          <div className="prop-row">
            <span className="prop-label">Width</span>
            <span className="prop-value">
              {computedState?.attrs?.width !== undefined 
                ? Math.round(computedState.attrs.width) 
                : snapshot.body?.attrs?.width !== undefined 
                  ? Math.round(snapshot.body.attrs.width) 
                  : '—'}
            </span>
          </div>
          <div className="prop-row">
            <span className="prop-label">Height</span>
            <span className="prop-value">
              {computedState?.attrs?.height !== undefined 
                ? Math.round(computedState.attrs.height) 
                : snapshot.body?.attrs?.height !== undefined 
                  ? Math.round(snapshot.body.attrs.height) 
                  : '—'}
            </span>
          </div>
          <div className="prop-row">
            <span className="prop-label">Version</span>
            <span className="prop-value">v{snapshot.version}</span>
          </div>
          <div className="prop-row">
            <span className="prop-label">Commits</span>
            <span className="prop-value">{commits.length}</span>
          </div>
        </>
      ) : (
        <p className="properties-placeholder">Select a layer to see properties</p>
      )}
    </>
  );
};
