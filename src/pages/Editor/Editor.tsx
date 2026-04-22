import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Transformer, Line } from 'react-konva';
import { useCanvasStore } from '../../store/useCanvasStore';
import { getComputedCanvasState } from '../../utils/canvasUtils';
import { KonvaNode } from '../../components/Canvas/KonvaNode';
import { LinePropertiesSection } from './components/LinePropertiesSection';
import { TOOLS } from './Editor.constants';
import { IconLayer } from './components/EditorIcons';
import './Editor.css';

// Sub-components
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { LayersPanel } from './components/LayersPanel';

// Hooks
import { useEditorNavigation } from './hooks/useEditorNavigation';
import { useEditorDrawing } from './hooks/useEditorDrawing';
import { useLayerActions } from './hooks/useLayerActions';

// ─── Component ────────────────────────────────────────────────────────────────

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const { isConnected, snapshot, commits, error, connect, disconnect, sendCommit } = useCanvasStore();

  // 1. Navigation Hook (Zoom/Pan)
  const { zoom, pan, setZoom, startPanning, zoomIn, zoomOut } = useEditorNavigation();

  // 2. Editor UI State
  const [activeTool, setActiveTool] = useState('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 3. Right Panel Sizing
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('webster_panel_width');
    return saved ? parseInt(saved, 10) : 260;
  });
  const [layersHeight, setLayersHeight] = useState<number>(() => {
    const saved = localStorage.getItem('webster_layers_height');
    return saved ? parseInt(saved, 10) : 340;
  });
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  // 4. Refs
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const canvasAreaRef = useRef<HTMLElement>(null);
  const localPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  // 5. Shared Canvas Handlers
  const handleNodeChange = useCallback((nodeId: string, attrs: any) => {
    if (attrs.x !== undefined || attrs.y !== undefined) {
      localPositions.current.set(nodeId, { x: attrs.x ?? 0, y: attrs.y ?? 0 });
    }
    sendCommit([{ op: 'update', id: nodeId, props: attrs }]);
    setTimeout(() => { localPositions.current.delete(nodeId); }, 500);
  }, [sendCommit]);

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
      const existingLines = computedState?.children?.flatMap((c: any) => c.children || []).filter((n: any) => n.className === 'Line') || [];
      const lineName = `Line ${existingLines.length + 1}`;
      
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

  // 8. Canvas State Synchronization
  useEffect(() => {
    if (id) connect(id);
    return () => { disconnect(); };
  }, [id, connect, disconnect]);

  // 9. Right Panel Resizing Effects
  useEffect(() => {
    localStorage.setItem('webster_panel_width', rightPanelWidth.toString());
  }, [rightPanelWidth]);

  useEffect(() => {
    localStorage.setItem('webster_layers_height', layersHeight.toString());
  }, [layersHeight]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingWidth) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 180 && newWidth < 600) setRightPanelWidth(newWidth);
      }
      if (isResizingHeight) {
        const panelBody = document.querySelector('.editor-right-panel');
        if (panelBody) {
          const rect = panelBody.getBoundingClientRect();
          const relativeY = e.clientY - rect.top;
          if (relativeY > 100 && relativeY < rect.height - 100) setLayersHeight(relativeY);
        }
      }
    };
    const handleMouseUp = () => {
      setIsResizingWidth(false);
      setIsResizingHeight(false);
      document.body.style.cursor = 'default';
    };
    if (isResizingWidth || isResizingHeight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingWidth, isResizingHeight]);

  // 10. Computations
  const computedState = useMemo(() => getComputedCanvasState(snapshot, commits), [snapshot, commits]);

  const displayState = useMemo(() => {
    if (!computedState || localPositions.current.size === 0) return computedState;
    const patchLayer = (layer: any): any => ({
      ...layer,
      children: layer.children?.map((child: any) => {
        const override = child.attrs?.id ? localPositions.current.get(child.attrs.id) : undefined;
        return override ? { ...child, attrs: { ...child.attrs, ...override } } : child;
      }),
    });
    return {
      ...computedState,
      children: computedState.children?.map((child: any) =>
        child.className === 'Layer' ? patchLayer(child) : child
      ),
    };
  }, [computedState]);

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

  // Handle Ctrl+Scroll to zoom
  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(z => Math.min(Math.max(0.1, z - e.deltaY * 0.002), 5));
      }
    };
    area.addEventListener('wheel', handleWheel, { passive: false });
    return () => area.removeEventListener('wheel', handleWheel);
  }, []);

  const rootLayers = useMemo(() => computedState?.children?.filter((c: any) => c.className === 'Layer') || [], [computedState]);

  const selectedNode = useMemo(() => {
    if (!selectedId || !computedState) return null;
    for (const layer of rootLayers) {
      const found = layer.children?.find((c: any) => c.attrs?.id === selectedId);
      if (found) return found;
    }
    return null;
  }, [selectedId, rootLayers, computedState]);

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
          onToolSelect={(toolId) => {
            setActiveTool(toolId);
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
                  style={{ cursor: activeTool === 'pen' ? 'crosshair' : 'default' }}
                  onMouseDown={(e: any) => {
                    if (activeTool === 'pen') {
                      handleDrawMouseDown(e);
                    } else if (e.target === e.target.getStage()) {
                      setSelectedId(null);
                      startPanning(e.evt.clientX, e.evt.clientY);
                    }
                  }}
                  onMouseMove={(e: any) => { if (activeTool === 'pen') handleDrawMouseMove(e); }}
                  onMouseUp={() => { if (activeTool === 'pen') handleDrawMouseUp(); }}
                  onClick={(e: any) => { if (activeTool !== 'pen' && e.target === e.target.getStage()) setSelectedId(null); }}
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
                        opacity={brushOpacity}
                        lineCap={brushLineCap}
                        lineJoin={brushLineCap === 'round' ? 'round' : 'miter'}
                        tension={brushTension}
                      />
                    )}
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
