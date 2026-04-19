import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Stage } from 'react-konva';
import { useCanvasStore } from '../../store/useCanvasStore';
import { getComputedCanvasState } from '../../utils/canvasUtils';
import { KonvaNode } from '../../components/Canvas/KonvaNode';
import { useMemo, useCallback } from 'react';
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

// ─── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  { id: 'select', label: 'Select (V)', Icon: IconSelect },
  { id: 'pen',    label: 'Pen (P)',    Icon: IconPen    },
  { id: 'image',  label: 'Image (I)',  Icon: IconImage  },
  { id: 'circle', label: 'Circle (O)', Icon: IconCircle },
  { id: 'text',   label: 'Text (T)',   Icon: IconText   },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Editor() {
  const { id } = useParams<{ id: string }>();

  const { isConnected, snapshot, commits, error, connect, disconnect, sendCommit } = useCanvasStore();

  const [activeTool, setActiveTool] = useState('select');

  // Compute the live canvas tree by applying commits to the snapshot
  const computedState = useMemo(() => {
    return getComputedCanvasState(snapshot, commits);
  }, [snapshot, commits]);

  useEffect(() => {
    if (id) connect(id);
    return () => { disconnect(); };
  }, [id, connect, disconnect]);

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
    const mainLayer = computedState.children?.find(c => c.className === 'Layer');
    if (!mainLayer) return [];

    mainLayer.children?.forEach((child: any, index: number) => {
      elements.push({
        id: child.attrs?.id ?? Math.random().toString(),
        name: child.attrs?.id || child.className,
        type: child.className,
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
    return computedState?.children?.filter(c => c.className === 'Layer') || [];
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

  // Send a minimal test commit
  const handleTestCommit = () => {
    const layerId = rootLayers[0]?.attrs?.id ?? 'layer-1';
    sendCommit([{
      op: 'add',
      parentId: layerId,
      node: {
        className: 'Rect',
        attrs: {
          id: `rect-${Date.now()}`,
          x: Math.floor(Math.random() * 400) + 50,
          y: Math.floor(Math.random() * 250) + 50,
          width: 80,
          height: 80,
          fill: `hsl(${Math.floor(Math.random() * 360)},60%,55%)`,
        },
      },
    }]);
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
          <button className="topbar-btn" title="Zoom out">−</button>
          <span className="topbar-canvas-name" style={{ minWidth: 36, textAlign: 'center' }}>100%</span>
          <button className="topbar-btn" title="Zoom in">+</button>
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
        <main className="editor-canvas-area">
          <div
            className="editor-canvas-frame"
            style={{ 
              width: computedState?.attrs?.width || 1280, 
              height: computedState?.attrs?.height || 720,
              // Scale down to fit the preview area if needed (temporary simple solution)
              transform: 'scale(0.5)',
              transformOrigin: 'center'
            }}
          >
            {isConnected && computedState ? (
              <Stage 
                width={computedState.attrs?.width || 1280} 
                height={computedState.attrs?.height || 720}
              >
                {computedState.children?.map((child, idx) => (
                  <KonvaNode key={child.attrs?.id || `node-${idx}`} node={child} />
                ))}
              </Stage>
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
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
        </main>

        {/* Right panel */}
        <aside className="editor-right-panel">
          {/* Layers */}
          <div className="panel-section">
            <div className="panel-header">Layers</div>
            <div className="layers-list">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="layers">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {allElements.length > 0 ? (
                        allElements.map((el, index) => (
                          <Draggable key={el.id} draggableId={el.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`layer-item ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                style={{ 
                                  ...provided.draggableProps.style,
                                  paddingLeft: 16 
                                }}
                              >
                                {getIconForType(el.type)}
                                {el.name}
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
            {snapshot ? (
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
