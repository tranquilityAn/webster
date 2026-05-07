import React, { useEffect, useState, useCallback, useRef, type CSSProperties } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Op } from '@paranoideed/drawebster';
import { Stage, Layer, Transformer, Line, Rect, Circle, RegularPolygon, Star, Arrow } from 'react-konva';
import { useCanvasStore } from '../../store/useCanvasStore';
import { KonvaNode } from '../../components/Canvas/KonvaNode';
import { SHAPE_DEFS } from './Editor.constants';
import type { ShapeType } from './Editor.constants';
import { IconLayer } from './components/EditorIcons';
import './Editor.css';

// Sub-components
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { LayersPanel } from './components/LayersPanel';
import { ShareModal } from './components/ShareModal';
import { SaveTemplateModal } from './components/SaveTemplateModal';
import { PropertiesPanel } from './components/PropertiesPanel';
import { InlineTextEditor } from './components/InlineTextEditor';

// Hooks
import { useEditorNavigation } from './hooks/useEditorNavigation';
import { useEditorDrawing } from './hooks/useEditorDrawing';
import { useEditorShapeDrawing } from './hooks/useEditorShapeDrawing';
import { useLayerActions } from './hooks/useLayerActions';
import { useEditorLayout } from './hooks/useEditorLayout';
import { useEditorCanvasState } from './hooks/useEditorCanvasState';
import { useEditorHotkeys } from './hooks/useEditorHotkeys';
import { usePositioning } from './hooks/usePositioning';

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { isConnected, snapshot, commits, headNumber, error, connect, disconnect, sendCommit, undo, redo } = useCanvasStore();

  // 1. Navigation & Viewport
  const { zoom, pan, setZoom, startPanning, zoomIn, zoomOut } = useEditorNavigation();

  // Derived undo/redo availability
  const canUndo = commits.length > 0 && commits[0].number < headNumber;
  const canRedo = commits.length > 0 && commits[commits.length - 1].number > headNumber;

  const { canvasAreaRef } = useEditorHotkeys({ setZoom, onUndo: undo, onRedo: redo });

  // 2. Editor UI State
  const [activeTool, setActiveTool] = useState('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeShape, setActiveShape] = useState<ShapeType>('ellipse');
  const [showShareModal, setShowShareModal] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Properties State
  const [shapeFill, setShapeFill] = useState('#4D96FF');
  const [shapeStroke, setShapeStroke] = useState('#1A1A1A');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2);
  const [shapeOpacity, setShapeOpacity] = useState(1);
  const [shapeDash, setShapeDash] = useState<number[]>([]);
  const [shapeRotation, setShapeRotation] = useState(0);
  const [arrowPointerLength, setArrowPointerLength] = useState(10);
  const [arrowPointerWidth, setArrowPointerWidth] = useState(10);
  const [arrowPointerAtBeginning, setArrowPointerAtBeginning] = useState(false);
  const [arrowPointerAtEnding, setArrowPointerAtEnding] = useState(true);

  // Text tool default properties
  const [textFontSize, setTextFontSize] = useState(32);
  const [textFontFamily, setTextFontFamily] = useState('Inter');
  const [textColor, setTextColor] = useState('#1A1A1A');
  const [textOpacity, setTextOpacity] = useState(1);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [textFontStyle, setTextFontStyle] = useState('normal');
  const [textDecoration, setTextDecoration] = useState('');
  const [textLetterSpacing, setTextLetterSpacing] = useState(0);
  const [textLineHeight, setTextLineHeight] = useState(1.2);
  const [textWidth, setTextWidth] = useState<number | 'auto'>('auto');
  const [textHeight, setTextHeight] = useState<number | 'auto'>('auto');
  const [textWrap, setTextWrap] = useState<'word' | 'char' | 'none'>('word');
  const [textPadding, setTextPadding] = useState(0);
  const [textStroke, setTextStroke] = useState('#ffffff');
  const [textStrokeWidth, setTextStrokeWidth] = useState(0);

  // Inline text-edit overlay state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const [editingTextStyle, setEditingTextStyle] = useState<CSSProperties>({});

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
  } = useEditorCanvasState({ snapshot, commits, headNumber, sendCommit, selectedId });

  // 4b. Positioning Module
  const positionableObjects = useMemo(() => {
    const allNodes: any[] = computedState?.children?.flatMap((c: any) => c.children || []) || [];
    return allNodes.map(n => ({
      id: n.attrs.id,
      x: n.attrs.x ?? 0,
      y: n.attrs.y ?? 0,
      width: n.attrs.width ?? (n.attrs.radius ? n.attrs.radius * 2 : 0),
      height: n.attrs.height ?? (n.attrs.radius ? n.attrs.radius * 2 : 0),
      rotation: n.attrs.rotation ?? 0,
    }));
  }, [computedState]);

  const positioning = usePositioning({
    objects: positionableObjects,
    selectedIds: useMemo(() => new Set(selectedId ? [selectedId] : []), [selectedId]),
    onCommit: (updates) => {
      const changes = updates.map(u => ({ op: 'update', id: u.id, props: { x: u.x, y: u.y } }));
      sendCommit(changes);
    }
  });

  const handleNodeDragMove = useCallback((nodeId: string, node: any) => {
    if (activeTool !== 'select') return;
    const w = node.width() || (node.radius() ? node.radius() * 2 : 0);
    const h = node.height() || (node.radius() ? node.radius() * 2 : 0);
    const result = positioning.snapDrag(nodeId, node.x(), node.y(), w, h);
    // Apply snapping visually during drag
    node.x(result.x);
    node.y(result.y);
  }, [activeTool, positioning]);

  const handleNodeDragEnd = useCallback((_nodeId: string) => {
    positioning.clearGuides();
  }, [positioning]);

  // 5. Refs
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const canvasFrameRef = useRef<HTMLDivElement>(null);

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

  // ── Text: place a new Text node on the canvas ──────────────────────────────
  const handlePlaceText = useCallback((canvasX: number, canvasY: number) => {
    const allNodes = computedState?.children?.flatMap((c: any) => c.children || []) || [];
    const textNodes = allNodes.filter((n: any) => n.className === 'Text');
    const textName = `Text ${textNodes.length + 1}`;
    const newId = `text-${Date.now()}`;

    sendCommit([{
      op: 'add',
      parentId: 'layer-1',
      node: {
        className: 'Text',
        attrs: {
          id: newId,
          name: textName,
          text: 'Text',
          x: canvasX,
          y: canvasY,
          fontSize: textFontSize,
          fontFamily: textFontFamily,
          fill: textColor,
          opacity: textOpacity,
          align: textAlign,
          fontStyle: textFontStyle,
          textDecoration: textDecoration,
          letterSpacing: textLetterSpacing,
          lineHeight: textLineHeight,
          width: textWidth === 'auto' ? undefined : textWidth,
          height: textHeight === 'auto' ? undefined : textHeight,
          wrap: textWrap,
          padding: textPadding,
          stroke: textStrokeWidth > 0 ? textStroke : undefined,
          strokeWidth: textStrokeWidth > 0 ? textStrokeWidth : undefined,
          draggable: true,
        },
      },
    }]);

    setTimeout(() => {
      setActiveTool('select');
      setSelectedId(newId);
    }, 50);
  }, [
    computedState, sendCommit,
    textFontSize, textFontFamily, textColor, textOpacity,
    textAlign, textFontStyle, textDecoration, textLetterSpacing, textLineHeight,
    textWidth, textHeight, textWrap, textPadding, textStroke, textStrokeWidth,
  ]);

  // ── Text: open inline textarea for editing ────────────────────────────────
  const handleOpenTextEdit = useCallback((nodeId: string) => {
    if (!stageRef.current) return;

    const konvaNode = stageRef.current.findOne(`#${nodeId}`);
    if (!konvaNode) return;

    // Get unscaled coordinates relative to the Stage/parent container
    const absPos = konvaNode.getAbsolutePosition();
    const width  = Math.max(konvaNode.width()  || 200, 120);
    const height = Math.max(konvaNode.height() || 40, 40);

    const attrs = konvaNode.attrs || {};
    const fontSize   = attrs.fontSize   || 32;
    const fontFamily = attrs.fontFamily  || 'Inter';
    const color      = attrs.fill        || '#1A1A1A';
    const fontStyle  = attrs.fontStyle   || 'normal';
    const align      = attrs.align       || 'left';
    const letterSpacing = attrs.letterSpacing || 0;
    const lineHeight    = attrs.lineHeight    || 1.2;
    const decoration    = attrs.textDecoration || '';
    const rotation      = attrs.rotation       || 0;

    const padding       = attrs.padding        || 0;

    const isBold   = fontStyle.includes('bold');
    const isItalic = fontStyle.includes('italic');

    setEditingTextId(nodeId);
    setEditingTextValue(attrs.text || '');
    setEditingTextStyle({
      left: absPos.x,
      top: absPos.y,
      width,
      minHeight: height,
      fontSize: `${fontSize}px`,
      fontFamily,
      color,
      fontWeight: isBold   ? 'bold'   : 'normal',
      fontStyle:  isItalic ? 'italic' : 'normal',
      textDecoration: decoration,
      textAlign: align as any,
      letterSpacing: `${letterSpacing}px`,
      lineHeight,
      padding: `${padding}px`,
      transform: `rotate(${rotation}deg)`,
      transformOrigin: 'top left',
    });
  }, []);

  const handleCloseTextEdit = useCallback(() => {
    if (!editingTextId) return;
    handleNodeChange(editingTextId, { text: editingTextValue || 'Text' });
    setEditingTextId(null);
  }, [editingTextId, editingTextValue, handleNodeChange]);


  // 8. WebSocket Sync
  useEffect(() => {
    if (id) connect(id);
    return () => { disconnect(); };
  }, [id, connect, disconnect]);

  // 9. Fetch project ID for sharing
  useEffect(() => {
    if (!id) return;
    fetch(`/webster/v1/canvases/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.data?.attributes?.project_id) {
          setProjectId(data.data.attributes.project_id);
        }
      })
      .catch(() => {});
  }, [id]);



  // 10. Apply Template if passed via location state
  useEffect(() => {
    const applyTemplate = async () => {
      const templateId = location.state?.templateId;
      if (!templateId || !isConnected || !computedState || commits.length > 0) {
        // If no template ID, or not connected, or canvas already has commits, don't apply
        return;
      }
      try {
        const res = await fetch(`/webster/v1/templates/${templateId}`);
        if (res.ok) {
          const data = await res.json();
          const templateBody = data.data?.attributes?.body;
          if (templateBody) {
            const changes: any[] = [];
            
            // 1. Update canvas (stage) size
            if (templateBody.attrs?.width || templateBody.attrs?.height) {
              changes.push({
                op: Op.UPDATE_STAGE,
                props: {
                  ...(templateBody.attrs.width ? { width: templateBody.attrs.width } : {}),
                  ...(templateBody.attrs.height ? { height: templateBody.attrs.height } : {})
                }
              });
            }

            // 2. Add layers and nodes
            if (templateBody.children) {
              const layers = templateBody.children.filter((c: any) => c.className === 'Layer');
              for (const layer of layers) {
                const nodes = layer.children || [];
                for (const node of nodes) {
                  // Ensure nodes don't clash with existing layers
                  if (node.className !== 'Transformer') {
                    changes.push({
                      op: Op.ADD,
                      parentId: 'layer-1', // Default layer
                      node: {
                        ...node,
                        attrs: {
                          ...node.attrs,
                          id: `${node.className}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        }
                      }
                    });
                  }
                }
              }
            }
            if (changes.length > 0) {
              sendCommit(changes);
            }
            // Clear state so we don't apply it again
            window.history.replaceState({}, document.title);
          }
        }
      } catch (err) {
        console.error('Failed to apply template', err);
      }
    };
    applyTemplate();
  }, [isConnected, commits.length, computedState, location.state?.templateId, sendCommit]);

  // 9. Transformer Effect
  useEffect(() => {
    if (!trRef.current) return;
    // Hide transformer while editing text inline
    if (!selectedId || !stageRef.current || activeTool !== 'select' || editingTextId) {
      trRef.current.nodes([]);
      return;
    }
    const node = stageRef.current.findOne(`#${selectedId}`);
    trRef.current.nodes(node && node.getType() !== 'Layer' ? [node] : []);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, displayState, activeTool, editingTextId]);

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

  return (
    <div className="editor-wrapper">
      <TopBar 
        isConnected={isConnected}
        id={id}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onShare={() => setShowShareModal(true)}
        onSaveAsTemplate={() => setShowTemplateModal(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
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

        <main className="editor-canvas-area" ref={canvasAreaRef} style={{ position: 'relative' }}>
          {error && <div className="editor-error-bar">{error}</div>}
          <div
            className="editor-canvas-frame"
            ref={canvasFrameRef}
            style={{ 
              width: (computedState?.attrs?.width || 1280) * zoom, 
              height: (computedState?.attrs?.height || 720) * zoom,
              overflow: 'hidden',
              flexShrink: 0,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              position: 'relative',
            }}
          >
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', display: 'block' }}>
              {isConnected && computedState ? (
                <>
                <Stage 
                  width={computedState.attrs?.width || 1280} 
                  height={computedState.attrs?.height || 720}
                  ref={stageRef}
                  style={{ cursor: (activeTool === 'pen' || activeTool === 'shapes' || activeTool === 'text') ? 'crosshair' : 'default' }}
                  onMouseDown={(e: any) => {
                    if (activeTool === 'pen') {
                      handleDrawMouseDown(e);
                    } else if (activeTool === 'shapes') {
                      handleShapeMouseDown(e, activeShape);
                    } else if (e.target === e.target.getStage()) {
                      if (activeTool !== 'text') {
                        setSelectedId(null);
                        startPanning(e.evt.clientX, e.evt.clientY);
                      }
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
                  onClick={(e: any) => {
                    // Close inline edit on stage click
                    if (editingTextId) { handleCloseTextEdit(); return; }
                    if (activeTool === 'text') {
                      const pos = e.target.getStage().getPointerPosition();
                      if (pos) handlePlaceText(pos.x, pos.y);
                    } else if (activeTool !== 'pen' && activeTool !== 'shapes' && e.target === e.target.getStage()) {
                      setSelectedId(null);
                    }
                  }}
                >
                  {displayState?.children?.map((child: any, idx: number) => (
                    <KonvaNode 
                      key={child.attrs?.id || `node-${idx}`} 
                      node={child} 
                      draggable={activeTool === 'select' && child.attrs?.id !== editingTextId}
                      editingTextId={editingTextId}
                      activeTool={activeTool}
                      onSelect={(nodeId) => {
                        if (editingTextId) { handleCloseTextEdit(); return; }
                        if (activeTool === 'select') setSelectedId(nodeId);
                        if (activeTool === 'text') {
                          // clicking an existing text node while text tool is active selects it
                          setActiveTool('select');
                          setSelectedId(nodeId);
                        }
                      }}
                      onChange={handleNodeChange}
                      onDblClick={(nodeId) => {
                        // Open inline editing on double-click for Text nodes
                        const n = computedState?.children?.flatMap((c: any) => c.children || []).find((x: any) => x.attrs?.id === nodeId);
                        if (n?.className === 'Text') {
                          setSelectedId(nodeId);
                          handleOpenTextEdit(nodeId);
                        }
                      }}
                      onDragMove={handleNodeDragMove}
                      onDragEndCallback={handleNodeDragEnd}
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

                  <Layer listening={false}>
                    {positioning.guides.map((g, i) =>
                      g.type === 'vertical'
                        ? <Line key={`guide-${i}`} points={[g.x, g.yStart, g.x, g.yEnd]} stroke="#EDE986" strokeWidth={1} dash={[4, 4]} />
                        : <Line key={`guide-${i}`} points={[g.xStart, g.y, g.xEnd, g.y]} stroke="#EDE986" strokeWidth={1} dash={[4, 4]} />
                    )}
                  </Layer>

                  <Layer>
                    <Transformer
                      ref={trRef}
                      rotateEnabled={true}
                      rotateAnchorOffset={50}
                      keepRatio={false}
                      ignoreStroke={true}
                      anchorSize={10}
                      anchorCornerRadius={2}
                      anchorStroke="#333333"
                      anchorFill="#EDE986"
                      anchorStrokeWidth={1}
                      borderStroke="#EDE986"
                      borderStrokeWidth={1.5}
                      borderDash={[4, 4]}
                      padding={5}
                      boundBoxFunc={(oldBox, newBox) => {
                        // Skip snapping for rotated objects
                        if (!selectedId || Math.abs(newBox.rotation ?? 0) > 0.01) {
                          return newBox;
                        }

                        const anchor = trRef.current?.getActiveAnchor();
                        const padding = 5; // Matches the padding prop

                        // Now that ignoreStroke={true}, newBox.x/y/width/height 
                        // represent the path + padding, which matches our attrs + padding.
                        const nodeBox = {
                          x: newBox.x + padding,
                          y: newBox.y + padding,
                          width: newBox.width - padding * 2,
                          height: newBox.height - padding * 2,
                        };

                        const snappedNodeBox = positioning.snapResize(
                          selectedId,
                          nodeBox,
                          anchor
                        );

                        return {
                          x: snappedNodeBox.x - padding,
                          y: snappedNodeBox.y - padding,
                          width: snappedNodeBox.width + padding * 2,
                          height: snappedNodeBox.height + padding * 2,
                          rotation: newBox.rotation
                        };
                      }}
                      onTransformEnd={() => {
                        positioning.clearGuides();
                      }}
                    />
                  </Layer>
                </Stage>

                {/* Inline textarea overlay for text editing */}
                {editingTextId && (
                  <InlineTextEditor
                    value={editingTextValue}
                    onChange={setEditingTextValue}
                    onClose={handleCloseTextEdit}
                    style={editingTextStyle}
                  />
                )}
                </>
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

            <PropertiesPanel
              activeTool={activeTool}
              selectedNode={selectedNode}
              recentColors={recentColors}
              
              brushColor={brushColor}
              brushSize={brushSize}
              brushOpacity={brushOpacity}
              brushLineCap={brushLineCap}
              brushTension={brushTension}
              onBrushChange={(updates) => {
                if (updates.stroke) setBrushColor(updates.stroke);
                if (updates.strokeWidth) setBrushSize(updates.strokeWidth);
                if (updates.opacity !== undefined) setBrushOpacity(updates.opacity);
                if (updates.lineCap) setBrushLineCap(updates.lineCap);
                if (updates.tension !== undefined) setBrushTension(updates.tension);
              }}

              shapeFill={shapeFill}
              shapeStroke={shapeStroke}
              shapeStrokeWidth={shapeStrokeWidth}
              shapeOpacity={shapeOpacity}
              shapeDash={shapeDash}
              shapeRotation={shapeRotation}
              onShapeChange={(updates) => {
                if (updates.fill !== undefined) setShapeFill(updates.fill);
                if (updates.stroke !== undefined) setShapeStroke(updates.stroke);
                if (updates.strokeWidth !== undefined) setShapeStrokeWidth(updates.strokeWidth);
                if (updates.opacity !== undefined) setShapeOpacity(updates.opacity);
                if (updates.dash !== undefined) setShapeDash(updates.dash);
                if (updates.rotation !== undefined) setShapeRotation(updates.rotation);
                if (updates.pointerLength !== undefined) setArrowPointerLength(updates.pointerLength);
                if (updates.pointerWidth !== undefined) setArrowPointerWidth(updates.pointerWidth);
                if (updates.pointerAtBeginning !== undefined) setArrowPointerAtBeginning(updates.pointerAtBeginning);
                if (updates.pointerAtEnding !== undefined) setArrowPointerAtEnding(updates.pointerAtEnding);
              }}

              textFontSize={textFontSize}
              textFontFamily={textFontFamily}
              textColor={textColor}
              textOpacity={textOpacity}
              textAlign={textAlign}
              textFontStyle={textFontStyle}
              textDecoration={textDecoration}
              textLetterSpacing={textLetterSpacing}
              textLineHeight={textLineHeight}
              textWidth={textWidth}
              textHeight={textHeight}
              textWrap={textWrap}
              textPadding={textPadding}
              textStroke={textStroke}
              textStrokeWidth={textStrokeWidth}
              onTextChange={(u) => {
                if (u.fontSize      !== undefined) setTextFontSize(u.fontSize);
                if (u.fontFamily    !== undefined) setTextFontFamily(u.fontFamily);
                if (u.fill         !== undefined) setTextColor(u.fill);
                if (u.opacity      !== undefined) setTextOpacity(u.opacity);
                if (u.align        !== undefined) setTextAlign(u.align as any);
                if (u.fontStyle    !== undefined) setTextFontStyle(u.fontStyle);
                if (u.textDecoration !== undefined) setTextDecoration(u.textDecoration);
                if (u.letterSpacing  !== undefined) setTextLetterSpacing(u.letterSpacing);
                if (u.lineHeight     !== undefined) setTextLineHeight(u.lineHeight);
                if (u.width          !== undefined) setTextWidth(u.width);
                if (u.height         !== undefined) setTextHeight(u.height);
                if (u.wrap           !== undefined) setTextWrap(u.wrap);
                if (u.padding        !== undefined) setTextPadding(u.padding);
                if (u.stroke         !== undefined) setTextStroke(u.stroke);
                if (u.strokeWidth    !== undefined) setTextStrokeWidth(u.strokeWidth);
              }}

              handleNodeChange={handleNodeChange}
              snapshot={snapshot}
              computedState={computedState}
              commits={commits}
            />
          </div>
        </aside>
      </div>

      {showShareModal && projectId && (
        <ShareModal
          projectId={projectId}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Save as Template Modal */}
      {showTemplateModal && computedState && (
        <SaveTemplateModal
          computedState={computedState}
          onClose={() => setShowTemplateModal(false)}
          onSuccess={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  );
}
