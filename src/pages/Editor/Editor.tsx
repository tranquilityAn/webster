import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Transformer, Line, Rect, Circle, RegularPolygon, Star, Arrow } from 'react-konva';
import { useCanvasStore } from '../../store/useCanvasStore';
import { KonvaNode } from '../../components/Canvas/KonvaNode';
import { LinePropertiesSection } from './components/LinePropertiesSection';
import { ShapePropertiesSection } from './components/ShapePropertiesSection';
import { SHAPE_DEFS } from './Editor.constants';
import type { ShapeType } from './Editor.constants';
import { IconLayer } from './components/EditorIcons';
import './Editor.css';

// Sub-components
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { LayersPanel } from './components/LayersPanel';

// Hooks
import { useEditorNavigation } from './hooks/useEditorNavigation';
import { useEditorDrawing } from './hooks/useEditorDrawing';
import { useEditorShapeDrawing } from './hooks/useEditorShapeDrawing';
import { useLayerActions } from './hooks/useLayerActions';
import { useEditorLayout } from './hooks/useEditorLayout';
import { useEditorCanvasState } from './hooks/useEditorCanvasState';
import { useEditorHotkeys } from './hooks/useEditorHotkeys';

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const { isConnected, snapshot, commits, error, connect, disconnect, sendCommit } = useCanvasStore();

  // 1. Navigation & Viewport
  const { zoom, pan, setZoom, startPanning, zoomIn, zoomOut } = useEditorNavigation();
  const { canvasAreaRef } = useEditorHotkeys({ setZoom });

  // 2. Editor UI State
  const [activeTool, setActiveTool] = useState('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeShape, setActiveShape] = useState<ShapeType>('ellipse');

  // Properties State
  const [shapeFill, setShapeFill] = useState('#4D96FF');
  const [shapeStroke, setShapeStroke] = useState('#1A1A1A');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2);
  const [shapeOpacity, setShapeOpacity] = useState(1);
  const [shapeDash, setShapeDash] = useState<number[]>([]);
  const [arrowPointerLength, setArrowPointerLength] = useState(10);
  const [arrowPointerWidth, setArrowPointerWidth] = useState(10);
  const [arrowPointerAtBeginning, setArrowPointerAtBeginning] = useState(false);
  const [arrowPointerAtEnding, setArrowPointerAtEnding] = useState(true);

  // 3. Layout & Panels
  const { 
    rightPanelWidth, layersHeight, 
    isResizingWidth, isResizingHeight, 
    setIsResizingWidth, setIsResizingHeight 
  } = useEditorLayout();

  // 4. Canvas Data & Optimistic State
  const {
    computedState, displayState, rootLayers,
    selectedNode, handleNodeChange
  } = useEditorCanvasState({ snapshot, commits, sendCommit, selectedId });

  // 5. Refs
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  // 6. Drawing Hook
  const {
    brushColor, setBrushColor, brushSize, setBrushSize,
    brushOpacity, setBrushOpacity, brushLineCap, setBrushLineCap,
    brushTension, setBrushTension, recentColors, livePoints,
    handleMouseDown: handleDrawMouseDown,
    handleMouseMove: handleDrawMouseMove,
    handleMouseUp: handleDrawMouseUp,
  } = useEditorDrawing({
    stageRef,
    onCommit: (points, attrs) => {
      const existingDrawings = computedState?.children?.flatMap((c: any) => c.children || []).filter((n: any) => n.attrs?.name?.startsWith('Drawing')) || [];
      const lineName = `Drawing ${existingDrawings.length + 1}`;
      
      sendCommit([{
        op: 'add',
        parentId: 'layer-1',
        node: {
          className: 'Line',
          attrs: {
            id: `line-${Date.now()}`,
            name: lineName,
            points,
            ...attrs,
            draggable: true
          }
        }
      }]);
    }
  });

  // 6b. Shape Drawing Hook
  const {
    liveShapeAttrs,
    handleShapeMouseDown,
    handleShapeMouseMove,
    handleShapeMouseUp,
  } = useEditorShapeDrawing({
    stageRef,
    zoom,
    onCommit: (shapeType, attrs) => {
      const shapeDef = SHAPE_DEFS.find(s => s.type === shapeType)!;
      const allNodes = computedState?.children?.flatMap((c: any) => c.children || []) || [];
      const sameNameNodes = allNodes.filter((n: any) => n.attrs?.name?.startsWith(shapeDef.label));
      const shapeName = `${shapeDef.label} ${sameNameNodes.length + 1}`;
      const newId = `${shapeType}-${Date.now()}`;

      let extraAttrs: Record<string, unknown> = {};
      if (shapeType === 'polygon') {
        const cx = (attrs.x as number) + (attrs.width as number) / 2;
        const cy = (attrs.y as number) + (attrs.height as number) / 2;
        const radius = Math.min(attrs.width as number, attrs.height as number) / 2;
        extraAttrs = { x: cx, y: cy, sides: 6, radius };
        delete (attrs as any).width;
        delete (attrs as any).height;
      } else if (shapeType === 'star') {
        const cx = (attrs.x as number) + (attrs.width as number) / 2;
        const cy = (attrs.y as number) + (attrs.height as number) / 2;
        const outerRadius = Math.min(attrs.width as number, attrs.height as number) / 2;
        extraAttrs = { x: cx, y: cy, numPoints: 5, outerRadius, innerRadius: outerRadius * 0.4 };
        delete (attrs as any).width;
        delete (attrs as any).height;
      } else if (shapeType === 'ellipse') {
        const cx = (attrs.x as number) + (attrs.width as number) / 2;
        const cy = (attrs.y as number) + (attrs.height as number) / 2;
        const radius = Math.min(attrs.width as number, attrs.height as number) / 2;
        extraAttrs = { x: cx, y: cy, radius };
        delete (attrs as any).width;
        delete (attrs as any).height;
      }

      sendCommit([{
        op: 'add',
        parentId: 'layer-1',
        node: {
          className: shapeDef.konvaClass,
          attrs: {
            id: newId,
            name: shapeName,
            fill: shapeFill,
            stroke: shapeStroke,
            strokeWidth: shapeStrokeWidth,
            opacity: shapeOpacity,
            draggable: true,
            ...attrs,
            ...extraAttrs,
          }
        }
      }]);
      
      setTimeout(() => {
        setActiveTool('select');
        setSelectedId(newId);
      }, 50);
    }
  });

  // 7. Layer Actions Hook
  const {
    handleDelete, handleToggleVisibility, handleStartRename,
    handleSaveRename, handleCancelRename, editingId, editingValue, setEditingValue
  } = useLayerActions({
    handleNodeChange,
    sendCommit,
    selectedId,
    setSelectedId,
  });

  // 8. WebSocket Sync
  useEffect(() => {
    if (id) connect(id);
    return () => { disconnect(); };
  }, [id, connect, disconnect]);

  // 9. Transformer Effect
  useEffect(() => {
    if (!trRef.current) return;
    if (!selectedId || !stageRef.current || activeTool !== 'select') {
      trRef.current.nodes([]);
      return;
    }
    const node = stageRef.current.findOne(`#${selectedId}`);
    trRef.current.nodes(node && node.getType() !== 'Layer' ? [node] : []);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, displayState, activeTool]);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const elements: any[] = [];
    computedState?.children?.find((c: any) => c.className === 'Layer')?.children?.forEach((child: any) => {
      elements.push({ id: child.attrs?.id });
    });
    const reversed = [...elements].reverse();
    const movedItemId = reversed[result.source.index].id;
    const newKonvaIndex = reversed.length - 1 - result.destination.index;
    sendCommit([{ op: 'reorder', id: movedItemId, newIndex: newKonvaIndex }]);
  }, [computedState, sendCommit]);

  const handleTestCommit = () => {
    const existingRects = computedState?.children?.flatMap((c: any) => c.children || []).filter((n: any) => n.className === 'Rect') || [];
    const rectName = `Rect ${existingRects.length + 1}`;
    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    const x = Math.random() * 400 + 50;
    const y = Math.random() * 300 + 50;
    const width = Math.random() * 100 + 50;
    const height = Math.random() * 100 + 50;

    sendCommit([{
      op: 'add',
      parentId: 'layer-1',
      node: {
        className: 'Rect',
        attrs: {
          id: `rect-${Date.now()}`,
          name: rectName,
          x, y, width, height,
          fill: randomColor,
          draggable: true
        }
      }
    }]);
  };

  return (
    <div className="editor-wrapper">
      <TopBar 
        isConnected={isConnected}
        id={id}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onTestCommit={handleTestCommit}
      />

      <div className="editor-body">
        <Toolbar 
          activeTool={activeTool}
          activeShape={activeShape}
          onToolSelect={(toolId) => {
            setActiveTool(toolId);
            setSelectedId(null);
          }}
          onShapeSelect={(shape) => {
            setActiveShape(shape);
            setActiveTool('shapes');
            setSelectedId(null);
          }}
        />

        <main className="editor-canvas-area" ref={canvasAreaRef}>
          {error && <div className="editor-error-bar">{error}</div>}
          <div
            className="editor-canvas-frame"
            style={{ 
              width: (computedState?.attrs?.width || 1280) * zoom, 
              height: (computedState?.attrs?.height || 720) * zoom,
              overflow: 'hidden',
              flexShrink: 0,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            }}
          >
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', display: 'block' }}>
              {isConnected && computedState ? (
                <Stage 
                  width={computedState.attrs?.width || 1280} 
                  height={computedState.attrs?.height || 720}
                  ref={stageRef}
                  style={{ cursor: (activeTool === 'pen' || activeTool === 'shapes') ? 'crosshair' : 'default' }}
                  onMouseDown={(e: any) => {
                    if (activeTool === 'pen') {
                      handleDrawMouseDown(e);
                    } else if (activeTool === 'shapes') {
                      handleShapeMouseDown(e, activeShape);
                    } else if (e.target === e.target.getStage()) {
                      setSelectedId(null);
                      startPanning(e.evt.clientX, e.evt.clientY);
                    }
                  }}
                  onMouseMove={(e: any) => {
                    if (activeTool === 'pen') handleDrawMouseMove(e);
                    else if (activeTool === 'shapes') handleShapeMouseMove(e);
                  }}
                  onMouseUp={() => {
                    if (activeTool === 'pen') handleDrawMouseUp();
                    else if (activeTool === 'shapes') handleShapeMouseUp(activeShape, {
                      fill: shapeFill,
                      stroke: shapeStroke,
                      strokeWidth: shapeStrokeWidth,
                      opacity: shapeOpacity,
                      dash: shapeDash,
                      pointerLength: arrowPointerLength,
                      pointerWidth: arrowPointerWidth,
                      pointerAtBeginning: arrowPointerAtBeginning,
                      pointerAtEnding: arrowPointerAtEnding,
                    });
                  }}
                  onClick={(e: any) => { if (activeTool !== 'pen' && activeTool !== 'shapes' && e.target === e.target.getStage()) setSelectedId(null); }}
                >
                  {displayState?.children?.map((child: any, idx: number) => (
                    <KonvaNode 
                      key={child.attrs?.id || `node-${idx}`} 
                      node={child} 
                      draggable={activeTool === 'select'}
                      onSelect={(nodeId) => { if (activeTool === 'select') setSelectedId(nodeId); }}
                      onChange={handleNodeChange}
                    />
                  ))}

                  <Layer listening={false}>
                    {livePoints && livePoints.length >= 4 && (
                      <Line
                        points={livePoints}
                        stroke={brushColor}
                        strokeWidth={brushSize}
                        opacity={brushOpacity * 0.6}
                        lineCap={brushLineCap}
                        lineJoin={brushLineCap === 'round' ? 'round' : 'miter'}
                        tension={brushTension}
                      />
                    )}
                    {liveShapeAttrs && (() => {
                      const { shapeType, x, y, width, height, points } = liveShapeAttrs;
                      const previewProps = {
                        fill: shapeFill,
                        stroke: shapeStroke,
                        strokeWidth: shapeStrokeWidth,
                        opacity: 0.45,
                        dash: [6, 4],
                      };
                      if (shapeType === 'rect') return <Rect x={x} y={y} width={width} height={height} {...previewProps} />;
                      if (shapeType === 'ellipse') return <Circle x={x + width / 2} y={y + height / 2} radius={Math.min(width, height) / 2} {...previewProps} />;
                      if (shapeType === 'polygon') return <RegularPolygon x={x + width / 2} y={y + height / 2} sides={6} radius={Math.min(width, height) / 2} {...previewProps} />;
                      if (shapeType === 'star') { const r = Math.min(width, height) / 2; return <Star x={x + width / 2} y={y + height / 2} numPoints={5} outerRadius={r} innerRadius={r * 0.4} {...previewProps} />; }
                      if (shapeType === 'line') return <Line points={points} {...previewProps} />;
                      if (shapeType === 'arrow') return <Arrow points={points} pointerLength={10} pointerWidth={10} {...previewProps} />;
                      return null;
                    })()}
                  </Layer>

                  <Layer>
                    <Transformer
                      ref={trRef}
                      rotateEnabled={false}
                      keepRatio={false}
                      anchorSize={20}
                      anchorCornerRadius={3}
                      anchorStroke="#EDE986"
                      anchorFill="#1A1A1A"
                      anchorStrokeWidth={2}
                      borderStroke="#EDE986"
                      borderStrokeWidth={1}
                      borderDash={[6, 4]}
                      padding={3}
                    />
                  </Layer>
                </Stage>
              ) : (
                <div className="canvas-placeholder">
                  <IconLayer />
                  <span>{!isConnected ? 'Connecting…' : 'Initialising canvas…'}</span>
                </div>
              )}
            </div>
          </div>
        </main>

        <div 
          className={`panel-resize-handle-v ${isResizingWidth ? 'is-resizing' : ''}`}
          onMouseDown={() => { setIsResizingWidth(true); document.body.style.cursor = 'col-resize'; }}
        />

        <aside className="editor-right-panel" style={{ width: rightPanelWidth }}>
          <div className="panel-section" style={{ height: layersHeight, flex: 'none' }}>
            <div className="panel-header">Layers</div>
            <LayersPanel
              rootLayers={rootLayers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={handleDelete}
              onToggleVisibility={handleToggleVisibility}
              onDragEnd={handleDragEnd}
              editingId={editingId}
              editingValue={editingValue}
              onRenameStart={handleStartRename}
              onRenameChange={setEditingValue}
              onRenameSave={handleSaveRename}
              onRenameCancel={handleCancelRename}
            />
          </div>

          <div 
            className={`panel-resize-handle-h ${isResizingHeight ? 'is-resizing' : ''}`}
            onMouseDown={() => { setIsResizingHeight(true); document.body.style.cursor = 'row-resize'; }}
          />

          <div className="properties-section" style={{ flex: 1 }}>
            <div className="panel-header" style={{ paddingLeft: 0, marginBottom: 10 }}>Properties</div>

            {activeTool === 'pen' ? (
              <LinePropertiesSection
                color={brushColor}
                width={brushSize}
                opacity={brushOpacity}
                lineCap={brushLineCap}
                tension={brushTension}
                recentColors={recentColors}
                onChange={(updates) => {
                  if (updates.stroke) setBrushColor(updates.stroke);
                  if (updates.strokeWidth) setBrushSize(updates.strokeWidth);
                  if (updates.opacity !== undefined) setBrushOpacity(updates.opacity);
                  if (updates.lineCap) setBrushLineCap(updates.lineCap);
                  if (updates.tension !== undefined) setBrushTension(updates.tension);
                }}
                showPreview
              />
            ) : activeTool === 'shapes' ? (
              <ShapePropertiesSection
                fill={shapeFill}
                stroke={shapeStroke}
                strokeWidth={shapeStrokeWidth}
                opacity={shapeOpacity}
                dash={shapeDash}
                recentColors={recentColors}
                onChange={(updates) => {
                  if (updates.fill !== undefined) setShapeFill(updates.fill);
                  if (updates.stroke !== undefined) setShapeStroke(updates.stroke);
                  if (updates.strokeWidth !== undefined) setShapeStrokeWidth(updates.strokeWidth);
                  if (updates.opacity !== undefined) setShapeOpacity(updates.opacity);
                  if (updates.dash !== undefined) setShapeDash(updates.dash);
                  if (updates.pointerLength !== undefined) setArrowPointerLength(updates.pointerLength);
                  if (updates.pointerWidth !== undefined) setArrowPointerWidth(updates.pointerWidth);
                  if (updates.pointerAtBeginning !== undefined) setArrowPointerAtBeginning(updates.pointerAtBeginning);
                  if (updates.pointerAtEnding !== undefined) setArrowPointerAtEnding(updates.pointerAtEnding);
                }}
              />
            ) : selectedNode && selectedNode.className === 'Line' ? (
              <LinePropertiesSection
                color={selectedNode.attrs?.stroke || '#000000'}
                width={selectedNode.attrs?.strokeWidth || 1}
                opacity={selectedNode.attrs?.opacity ?? 1}
                lineCap={selectedNode.attrs?.lineCap || 'round'}
                tension={selectedNode.attrs?.tension ?? 0}
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
                  <span className="prop-value">{snapshot.body?.attrs?.width ?? '—'}</span>
                </div>
                <div className="prop-row">
                  <span className="prop-label">Height</span>
                  <span className="prop-value">{snapshot.body?.attrs?.height ?? '—'}</span>
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
          </div>
        </aside>
      </div>
    </div>
  );
}
