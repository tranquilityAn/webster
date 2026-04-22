import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Transformer, Line } from 'react-konva';
import { useCanvasStore } from '../../store/useCanvasStore';
import { getComputedCanvasState } from '../../utils/canvasUtils';
import { KonvaNode } from '../../components/Canvas/KonvaNode';
import { useMemo, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import './Editor.css';

// ─── SVG Icon components ───────────────────────────────────────────────────────

const IconSelect = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 3l14 9-7 1-4 6-3-16z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconImage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="8.5" cy="8.5" r="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconText = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <polyline points="4 7 4 4 20 4 20 7" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="9" y1="20" x2="15" y2="20" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="4" x2="12" y2="20" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconLayer = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12 2 2 7 12 12 22 7 12 2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="2 17 12 22 22 17" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="2 12 12 17 22 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconUndo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <polyline points="9 14 4 9 9 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 20v-7a4 4 0 00-4-4H4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconRedo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <polyline points="15 14 20 9 15 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 20v-7a4 4 0 014-4h12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconRect = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconGroup = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 011.58-2.61M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  { id: 'select', label: 'Select (V)', Icon: IconSelect },
  { id: 'pen',    label: 'Pen (P)',    Icon: IconPen    },
  { id: 'image',  label: 'Image (I)',  Icon: IconImage  },
  { id: 'circle', label: 'Circle (O)', Icon: IconCircle },
  { id: 'text',   label: 'Text (T)',   Icon: IconText   },
];

// ─── Component ────────────────────────────────────────────────────────────────

// ─── Draw brush settings ──────────────────────────────────────────────────────

const LINE_CAP_OPTIONS = [
  { value: 'round',  label: 'Round'  },
  { value: 'square', label: 'Square' },
  { value: 'butt',   label: 'Flat'   },
];

const DEFAULT_COLORS = [
  '#FFFFFF', // White
  '#1A1A1A', // Dark
  '#FF6B6B', // Red
  '#FF9F45', // Orange
  '#EDE986', // Primary Accent (Yellow)
  '#6BCB77', // Green
  '#4D96FF', // Blue
  '#A29BFE', // Purple
];

const MAX_RECENT_COLORS = 8;

export default function Editor() {
  const { id } = useParams<{ id: string }>();

  const { isConnected, snapshot, commits, error, connect, disconnect, sendCommit } = useCanvasStore();

  const [activeTool, setActiveTool] = useState('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [zoom, setZoom] = useState<number>(0.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // ── Draw tool settings ────────────────────────────────────────────────────
  const [brushColor,   setBrushColor]   = useState('#EDE986');
  const [brushSize,    setBrushSize]    = useState(4);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushLineCap, setBrushLineCap] = useState<'round' | 'square' | 'butt'>('round');
  const [brushTension, setBrushTension] = useState(0.5);

  // ── Color History ─────────────────────────────────────────────────────────
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('webster_recent_colors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('webster_recent_colors', JSON.stringify(recentColors));
  }, [recentColors]);

  const addRecentColor = useCallback((color: string) => {
    setRecentColors(prev => {
      // Normalize color to comparison
      const normalized = color.toUpperCase();
      const filtered = prev.filter(c => c.toUpperCase() !== normalized);
      return [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    });
  }, []);

  // ── In-progress drawing state ─────────────────────────────────────────────
  const isDrawingRef   = useRef(false);
  const currentLineRef = useRef<number[]>([]);
  const [livePoints, setLivePoints] = useState<number[] | null>(null);

  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const canvasAreaRef = useRef<HTMLElement>(null);
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // localPositions stores optimistic overrides for node positions during/after drag.
  // Using a ref (not state) means updating it does NOT trigger a React re-render,
  // which is exactly what we want: Konva already moved the shape visually,
  // we just need to make sure the next computedState rebuild doesn't reset it.
  const localPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Recompute the base canvas tree from snapshot + server commits
  const computedState = useMemo(() => {
    return getComputedCanvasState(snapshot, commits);
  }, [snapshot, commits]);

  // Apply local position overrides on top of the server state.
  // This produces the final tree that Konva renders, with any in-flight
  // drag positions applied so shapes don't jump back on commit:ack.
  const displayState = useMemo(() => {
    if (!computedState || localPositions.current.size === 0) return computedState;

    // Deep-clone only the parts we need to mutate (children attrs)
    const patchLayer = (layer: any): any => {
      if (!layer.children) return layer;
      return {
        ...layer,
        children: layer.children.map((child: any) => {
          const override = child.attrs?.id ? localPositions.current.get(child.attrs.id) : undefined;
          if (!override) return child;
          return {
            ...child,
            attrs: { ...child.attrs, ...override },
          };
        }),
      };
    };

    return {
      ...computedState,
      children: computedState.children?.map((child: any) =>
        child.className === 'Layer' ? patchLayer(child) : child
      ),
    };
  }, [computedState]);

  // Attach Transformer only when in Select mode AND something is selected.
  // Switching to another tool immediately hides resize handles.
  useEffect(() => {
    if (!trRef.current) return;

    // Only show Transformer in Select mode with a valid selection
    if (!selectedId || !stageRef.current || activeTool !== 'select') {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
      return;
    }

    const node = stageRef.current.findOne(`#${selectedId}`);
    if (node && node.getType() !== 'Layer') {
      trRef.current.nodes([node]);
    } else {
      trRef.current.nodes([]);
    }
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, displayState, activeTool]);

  useEffect(() => {
    if (id) connect(id);
    return () => { disconnect(); };
  }, [id, connect, disconnect]);

  // Handle Ctrl+Scroll to zoom
  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(z => {
          // Adjust zoom multiplier for a smooth feel
          const newZoom = z - e.deltaY * 0.002;
          return Math.min(Math.max(0.1, newZoom), 5); // clamp between 10% and 500%
        });
      }
    };

    // passive: false is required to prevent default zooming behavior in browser
    area.addEventListener('wheel', handleWheel, { passive: false });
    return () => area.removeEventListener('wheel', handleWheel);
  }, []);

  // Handle panning the canvas visually
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isPanningRef.current) return;
      setPan({
        x: startPanRef.current.panX + (e.clientX - startPanRef.current.x),
        y: startPanRef.current.panY + (e.clientY - startPanRef.current.y),
      });
    };

    const handlePointerUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        document.body.style.cursor = 'default';
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handleStartPanning = (clientX: number, clientY: number) => {
    isPanningRef.current = true;
    startPanRef.current = {
      x: clientX,
      y: clientY,
      panX: pan.x,
      panY: pan.y,
    };
    document.body.style.cursor = 'grabbing';
  };

  const activeToolRef = useRef(activeTool);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

  // ── Drawing helpers ───────────────────────────────────────────────────────

  // Convert stage-relative pointer position accounting for current pan + zoom
  const getScaledPointer = (stage: any) => {
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    // Konva already accounts for CSS scale inside getPointerPosition()
    // by comparing the stage attributes (width/height) with getBoundingClientRect().
    return pos;
  };

  const brushColorRef   = useRef(brushColor);
  const brushSizeRef    = useRef(brushSize);
  const brushOpacityRef = useRef(brushOpacity);
  const brushLineCapRef = useRef(brushLineCap);
  const brushTensionRef = useRef(brushTension);
  useEffect(() => { brushColorRef.current   = brushColor;   }, [brushColor]);
  useEffect(() => { brushSizeRef.current    = brushSize;    }, [brushSize]);
  useEffect(() => { brushOpacityRef.current = brushOpacity; }, [brushOpacity]);
  useEffect(() => { brushLineCapRef.current = brushLineCap; }, [brushLineCap]);
  useEffect(() => { brushTensionRef.current = brushTension; }, [brushTension]);

  const handleDrawMouseDown = useCallback((e: any) => {
    if (activeToolRef.current !== 'pen') return;
    
    const stage = e.target.getStage();
    isDrawingRef.current = true;
    const pos = getScaledPointer(stage);
    if (!pos) return;
    currentLineRef.current = [pos.x, pos.y];
    setLivePoints([pos.x, pos.y]);
  }, [zoom]);

  const handleDrawMouseMove = useCallback((e: any) => {
    if (!isDrawingRef.current || activeToolRef.current !== 'pen') return;
    const stage = e.target.getStage();
    const pos = getScaledPointer(stage);
    if (!pos) return;
    currentLineRef.current = [...currentLineRef.current, pos.x, pos.y];
    setLivePoints([...currentLineRef.current]);
  }, [zoom]);

  const handleDrawMouseUp = useCallback(() => {
    if (!isDrawingRef.current || activeToolRef.current !== 'pen') return;
    isDrawingRef.current = false;

    const points = currentLineRef.current;
    if (points.length < 4) {
      // Too short — just a tap, ignore
      setLivePoints(null);
      currentLineRef.current = [];
      return;
    }

    // Commit the line to the server — find the first Layer on the stage
    const layerNode = stageRef.current?.findOne('Layer');
    const layerId = layerNode?.id() || null;

    const lineId = `line-${Date.now()}`;
    const ops: any[] = [];

    // If no layer exists yet we need to add one first
    if (!layerId) {
      const newLayerId = `layer-${Date.now()}`;
      ops.push({
        op: 'add_layer',
        layer: { className: 'Layer', attrs: { id: newLayerId }, children: [] },
      });
      ops.push({
        op: 'add',
        parentId: newLayerId,
        node: {
          className: 'Line',
          attrs: {
            id: lineId,
            points,
            stroke: brushColorRef.current,
            strokeWidth: brushSizeRef.current,
            opacity: brushOpacityRef.current,
            lineCap: brushLineCapRef.current,
            lineJoin: brushLineCapRef.current === 'round' ? 'round' : 'miter',
            tension: brushTensionRef.current,
            globalCompositeOperation: 'source-over',
          },
        },
      });
    } else {
      ops.push({
        op: 'add',
        parentId: layerId,
        node: {
          className: 'Line',
          attrs: {
            id: lineId,
            points,
            stroke: brushColorRef.current,
            strokeWidth: brushSizeRef.current,
            opacity: brushOpacityRef.current,
            lineCap: brushLineCapRef.current,
            lineJoin: brushLineCapRef.current === 'round' ? 'round' : 'miter',
            tension: brushTensionRef.current,
            globalCompositeOperation: 'source-over',
          },
        },
      });
    }

    sendCommit(ops);
    addRecentColor(brushColorRef.current);
    setLivePoints(null);
    currentLineRef.current = [];
  }, [sendCommit, addRecentColor]);

  // Helper to get icon based on className
  const getIconForType = (type: string) => {
    switch (type) {
      case 'Layer': return <IconLayer />;
      case 'Rect':  return <IconRect />;
      case 'Circle': return <IconCircle />;
      case 'Text':   return <IconText />;
      case 'Group':  return <IconGroup />;
      default:       return <IconLayer />;
    }
  };

  // Flatten computedState into a list of displayable elements
  const allElements = useMemo(() => {
    if (!computedState) return [];
    
    const elements: { id: string; name: string; type: string; depth: number; index: number }[] = [];
    
    // We only care about children of the first Layer (as user requested)
    const mainLayer = computedState.children?.find((c: any) => c.className === 'Layer');
    if (!mainLayer) return [];

    mainLayer.children?.forEach((child: any, index: number) => {
      elements.push({
        id: child.attrs?.id ?? Math.random().toString(),
        name: child.attrs?.name || child.attrs?.id || child.className,
        type: child.className,
        visible: child.attrs?.visible !== false,
        depth: 0,
        index // This is the local index within the parent layer
      });
    });

    // reverse for UI usually (top elements first), but let's keep it sync with drawing order (bottom first)
    // Actually, in Konva, last in children array is drawn on top.
    // In Layers panel, usually TOP of list means drawn on TOP. 
    // So we should reverse the array for display.
    return [...elements].reverse();
  }, [computedState]);

  // Derive layers (top-level only) for commit targeting
  const rootLayers = useMemo(() => {
    return computedState?.children?.filter((c: any) => c.className === 'Layer') || [];
  }, [computedState]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const sourceIndexInList = result.source.index;
    const destIndexInList = result.destination.index;
    
    // items in allElements are reversed (top of list is last in array)
    // list index 0 -> array index length-1
    // list index N -> array index length-1-N
    
    const movedItemId = allElements[sourceIndexInList].id;
    
    // Calculate new index in terms of Konva children order (0 is bottom)
    // If list has [A, B, C] (C is top), Konva array is [A, B, C]
    // Drag C to index 2 (bottom of list): list becomes [A, B, C]... wait.
    // Example: List [C (top), B, A (bottom)] -> Konva [A, B, C]
    // Move C to index 2 (bottom of list): list [B, A, C] -> Konva [C, B, A]
    // The list index 'i' maps to Konva index 'length - 1 - i'.
    const newKonvaIndex = allElements.length - 1 - destIndexInList;

    sendCommit([{
      op: 'reorder',
      id: movedItemId,
      newIndex: newKonvaIndex
    }]);
  }, [allElements, sendCommit]);

  const handleNodeChange = useCallback((nodeId: string, newProps: any) => {
    // Store the optimistic position so we can keep showing it while the
    // commit round-trips to the server. It will be cleaned up once the
    // server's commit:ack causes computedState to update with the real value.
    if (newProps.x !== undefined || newProps.y !== undefined) {
      localPositions.current.set(nodeId, {
        x: newProps.x ?? 0,
        y: newProps.y ?? 0,
      });
    }
    sendCommit([{
      op: 'update',
      id: nodeId,
      props: newProps,
    }]);
    // After the new commit is processed and displayState includes the new coords,
    // the override is no longer needed. We clean it up on the next render cycle.
    // Using a timeout ensures the new computedState has already been calculated.
    setTimeout(() => {
      localPositions.current.delete(nodeId);
    }, 500);
  }, [sendCommit]);

  const handleDelete = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sendCommit([{
      op: 'delete',
      id: nodeId
    }]);
    if (selectedId === nodeId) {
      setSelectedId(null);
    }
  }, [sendCommit, selectedId]);

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingValue(currentName);
  };

  const handleSaveRename = () => {
    if (editingId && editingValue.trim()) {
      sendCommit([{
        op: 'update',
        id: editingId,
        props: { name: editingValue.trim() }
      }]);
    }
    setEditingId(null);
    setEditingValue('');
  };

  const handleToggleVisibility = (id: string, currentVisible: boolean) => {
    sendCommit([{
      op: 'update',
      id: id,
      props: { visible: !currentVisible }
    }]);
  };

  // Send a minimal test commit
  const handleTestCommit = () => {
    let layerId = rootLayers[0]?.attrs?.id;
    const ops: any[] = [];
    
    if (!layerId) {
      layerId = `layer-${Date.now()}`;
      ops.push({
        op: 'add_layer',
        layer: {
          className: 'Layer',
          attrs: { id: layerId },
          children: []
        }
      });
    }
    
    // Get canvas dimensions
    const canvasWidth = computedState?.attrs?.width || 1280;
    const canvasHeight = computedState?.attrs?.height || 720;
    
    // Position near center with some random jitter
    const x = Math.floor(canvasWidth / 2 - 40 + (Math.random() * 60 - 30));
    const y = Math.floor(canvasHeight / 2 - 40 + (Math.random() * 60 - 30));

    ops.push({
      op: 'add',
      parentId: layerId,
      node: {
        className: 'Rect',
        attrs: {
          id: `rect-${Date.now()}`,
          x,
          y,
          width: 80,
          height: 80,
          fill: `hsl(${Math.floor(Math.random() * 360)},60%,55%)`,
        },
      },
    });

    sendCommit(ops);
  };

  return (
    <div className="editor-wrapper">

      {/* ── Top Bar ── */}
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <button className="topbar-btn" title="Undo" onClick={() => {}}>
            <IconUndo />
          </button>
          <button className="topbar-btn" title="Redo" onClick={() => {}}>
            <IconRedo />
          </button>
          <div className="topbar-divider" />
          <div
            className="status-dot"
            title={isConnected ? 'Connected' : 'Disconnected'}
            style={{ backgroundColor: isConnected ? '#2ecc71' : '#e74c3c' }}
          />
          <span className="topbar-canvas-name">Canvas · {id?.slice(0, 8)}…</span>
        </div>

        <div className="editor-topbar-right">
          <button className="topbar-btn" title="Zoom out" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>−</button>
          <span className="topbar-canvas-name" style={{ minWidth: 42, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button className="topbar-btn" title="Zoom in" onClick={() => setZoom(z => Math.min(5, z + 0.1))}>+</button>
          <div className="topbar-divider" />
          <button
            className="topbar-btn topbar-btn-accent"
            onClick={handleTestCommit}
            disabled={!isConnected}
            title="Send a test commit to canvas"
          >
            Test Commit
          </button>
        </div>
      </div>

      {/* Error bar */}
      {error && <div className="editor-error-bar">{error}</div>}

      {/* ── Body ── */}
      <div className="editor-body">

        {/* Left toolbar */}
        <aside className="editor-toolbar">
          {TOOLS.map(({ id: toolId, label, Icon }, idx) => (
            <>
              {idx === 2 && <div key={`sep-${toolId}`} className="toolbar-separator" />}
              <button
                key={toolId}
                className={`toolbar-btn${activeTool === toolId ? ' active' : ''}`}
                title={label}
                onClick={() => setActiveTool(toolId)}
              >
                <Icon />
              </button>
            </>
          ))}
        </aside>

        {/* Canvas area */}
        <main 
          className="editor-canvas-area" 
          ref={canvasAreaRef}
        >
          {/* 
            Centering trick: outer div has the *scaled* pixel dimensions so that
            flexbox (on .editor-canvas-area) can correctly center it.
            The inner stage is rendered at full native resolution but CSS-scaled,
            with transform-origin at top-left so it grows downward/rightward
            inside the already-correctly-sized box.
            overflow:hidden clips any rounding bleed.
          */}
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
                      handleStartPanning(e.evt.clientX, e.evt.clientY);
                    }
                  }}
                  onMouseMove={(e: any) => {
                    if (activeTool === 'pen') handleDrawMouseMove(e);
                  }}
                  onMouseUp={() => {
                    if (activeTool === 'pen') handleDrawMouseUp();
                  }}
                  onClick={(e: any) => {
                    if (activeTool !== 'pen' && e.target === e.target.getStage()) {
                      setSelectedId(null);
                    }
                  }}
                  onTap={(e: any) => {
                    if (activeTool !== 'pen' && e.target === e.target.getStage()) {
                      setSelectedId(null);
                    }
                  }}
                >
                  {displayState?.children?.map((child: any, idx: number) => (
                    <KonvaNode 
                      key={child.attrs?.id || `node-${idx}`} 
                      node={child} 
                      draggable={activeTool === 'select'}
                      onSelect={(nodeId) => {
                        if (activeTool === 'select') {
                          setSelectedId(nodeId);
                        }
                      }}
                      onChange={handleNodeChange}
                    />
                  ))}
                  {/* Live drawing preview layer */}
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
                        globalCompositeOperation="source-over"
                      />
                    )}
                  </Layer>

                  {/* Transformer lives in its own Layer.
                      Do NOT set listening={false} on this Layer —
                      anchors need mouse events to be drag-resizable. */}
                  <Layer>
                    <Transformer
                      ref={trRef}
                      rotateEnabled={false}
                      keepRatio={false}
                      boundBoxFunc={(_oldBox: any, newBox: any) => {
                        if (newBox.width < 5) newBox.width = 5;
                        if (newBox.height < 5) newBox.height = 5;
                        return newBox;
                      }}
                      anchorSize={20}
                      anchorCornerRadius={3}
                      anchorStroke="#EDE986"
                      anchorFill="#1A1A1A"
                      anchorStrokeWidth={2}
                      anchorStyleFunc={(anchor: any) => {
                        anchor.hitStrokeWidth(16);
                      }}
                      borderStroke="#EDE986"
                      borderStrokeWidth={1}
                      borderDash={[6, 4]}
                      padding={3}
                    />
                  </Layer>
                </Stage>
              ) : (
                <div style={{
                  width: computedState?.attrs?.width || 1280,
                  height: computedState?.attrs?.height || 720,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  color: '#999',
                  fontSize: 13,
                }}>
                  <IconLayer />
                  <span>
                    {!isConnected ? 'Connecting…' : 'Initialising canvas…'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right panel */}
        <aside className="editor-right-panel">
          {/* Layers */}
          <div className="panel-section">
            <div className="panel-header">Layers</div>
            <div className="layers-list">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="layers">
                  {(provided: any) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {allElements.length > 0 ? (
                        allElements.map((el, index) => (
                          <Draggable key={el.id} draggableId={el.id} index={index}>
                            {(provided: any, snapshot: any) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`layer-item ${snapshot.isDragging ? 'is-dragging' : ''} ${selectedId === el.id ? 'active' : ''} ${!el.visible ? 'is-hidden' : ''}`}
                                onClick={() => setSelectedId(el.id)}
                                onDoubleClick={() => handleStartRename(el.id, el.name)}
                                style={{ 
                                  ...provided.draggableProps.style,
                                  paddingLeft: 16 
                                }}
                              >
                                <div className="layer-item-main">
                                  <button 
                                    className="layer-visibility-btn" 
                                    onClick={(e) => { e.stopPropagation(); handleToggleVisibility(el.id, el.visible); }}
                                    title={el.visible ? 'Hide layer' : 'Show layer'}
                                  >
                                    {el.visible ? <IconEye /> : <IconEyeOff />}
                                  </button>
                                  {getIconForType(el.type)}
                                  {editingId === el.id ? (
                                    <input
                                      className="layer-item-input"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      onBlur={handleSaveRename}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveRename();
                                        if (e.key === 'Escape') setEditingId(null);
                                      }}
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                      onDoubleClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span className="layer-item-name">{el.name}</span>
                                  )}
                                </div>
                                <button 
                                  className="layer-delete-btn" 
                                  onClick={(e) => handleDelete(el.id, e)}
                                  title="Delete object"
                                >
                                  <IconTrash />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        ['Item 1', 'Item 2', 'Item 3'].map((name) => (
                          <div key={name} className="layer-item">
                            <IconLayer />
                            {name}
                          </div>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>

          <div className="panel-divider" />

          {/* Properties */}
          <div className="properties-section">
            <div className="panel-header" style={{ paddingLeft: 0, marginBottom: 10 }}>Properties</div>

            {activeTool === 'pen' ? (
              /* ── Draw Tool Properties ── */
              <div className="draw-props">

                {/* Color */}
                <div className="draw-prop-group">
                  <label className="draw-prop-label">Color</label>
                  <div className="draw-color-row">
                    <div className="color-swatch-wrapper">
                      <input
                        id="brush-color"
                        type="color"
                        value={brushColor}
                        onChange={e => setBrushColor(e.target.value)}
                        className="color-input"
                        title="Brush color"
                      />
                      <div className="color-swatch" style={{ backgroundColor: brushColor }} />
                    </div>
                    <span className="draw-prop-value-label">{brushColor.toUpperCase()}</span>
                  </div>
                  <div className="quick-colors-section">
                    <span className="quick-colors-label">Default</span>
                    <div className="quick-colors">
                      {DEFAULT_COLORS.map(c => (
                        <button
                          key={c}
                          className={`quick-color-btn${brushColor.toUpperCase() === c.toUpperCase() ? ' active' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setBrushColor(c)}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>

                  {recentColors.length > 0 && (
                    <div className="quick-colors-section">
                      <span className="quick-colors-label">Recent</span>
                      <div className="quick-colors">
                        {recentColors.map(c => (
                          <button
                            key={`recent-${c}`}
                            className={`quick-color-btn${brushColor.toUpperCase() === c.toUpperCase() ? ' active' : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setBrushColor(c)}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stroke Width */}
                <div className="draw-prop-group">
                  <div className="draw-prop-header">
                    <label className="draw-prop-label">Width</label>
                    <span className="draw-prop-val">{brushSize}px</span>
                  </div>
                  <input
                    id="brush-size"
                    type="range"
                    min={1}
                    max={80}
                    step={1}
                    value={brushSize}
                    onChange={e => setBrushSize(Number(e.target.value))}
                    className="draw-slider"
                  />
                  <div className="draw-slider-marks">
                    <span>1</span><span>40</span><span>80</span>
                  </div>
                </div>

                {/* Opacity */}
                <div className="draw-prop-group">
                  <div className="draw-prop-header">
                    <label className="draw-prop-label">Opacity</label>
                    <span className="draw-prop-val">{Math.round(brushOpacity * 100)}%</span>
                  </div>
                  <input
                    id="brush-opacity"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={brushOpacity}
                    onChange={e => setBrushOpacity(Number(e.target.value))}
                    className="draw-slider opacity-slider"
                    style={{
                      '--slider-color': brushColor,
                    } as React.CSSProperties}
                  />
                  <div className="draw-slider-marks">
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </div>

                {/* Line Cap */}
                <div className="draw-prop-group">
                  <label className="draw-prop-label">Line cap</label>
                  <div className="linecap-options">
                    {LINE_CAP_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        className={`linecap-btn${brushLineCap === opt.value ? ' active' : ''}`}
                        onClick={() => setBrushLineCap(opt.value as any)}
                        title={opt.label}
                      >
                        <span className={`linecap-preview linecap-${opt.value}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tension (smoothness) */}
                <div className="draw-prop-group">
                  <div className="draw-prop-header">
                    <label className="draw-prop-label">Smoothness</label>
                    <span className="draw-prop-val">{Math.round(brushTension * 100)}%</span>
                  </div>
                  <input
                    id="brush-tension"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={brushTension}
                    onChange={e => setBrushTension(Number(e.target.value))}
                    className="draw-slider"
                  />
                  <div className="draw-slider-marks">
                    <span>Sharp</span><span>Smooth</span>
                  </div>
                </div>

                {/* Preview */}
                <div className="draw-prop-group">
                  <label className="draw-prop-label">Preview</label>
                  <div className="brush-preview-wrap">
                    <svg width="100%" height="44" viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M10 22 Q 50 8, 100 22 T 190 22"
                        fill="none"
                        stroke={brushColor}
                        strokeWidth={Math.min(brushSize, 30)}
                        strokeLinecap={brushLineCap}
                        strokeLinejoin={brushLineCap === 'round' ? 'round' : 'miter'}
                        opacity={brushOpacity}
                      />
                    </svg>
                  </div>
                </div>

              </div>
            ) : snapshot ? (
              /* ── Canvas/Element Properties ── */
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
