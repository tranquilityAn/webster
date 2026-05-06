import React from 'react';
import { IconUndo, IconRedo, IconDots } from './EditorIcons';

interface TopBarProps {
  isConnected: boolean;
  id?: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onShare: () => void;
  onSaveAsTemplate?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  isConnected,
  id,
  zoom,
  onZoomIn,
  onZoomOut,
  onShare,
  onSaveAsTemplate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="editor-topbar">
      <div className="editor-topbar-left">
        <button
          className="topbar-btn"
          title="Undo (Ctrl+Z)"
          onClick={onUndo}
          disabled={!canUndo}
          style={{ opacity: canUndo ? 1 : 0.35, cursor: canUndo ? 'pointer' : 'default' }}
        >
          <IconUndo />
        </button>
        <button
          className="topbar-btn"
          title="Redo (Ctrl+Shift+Z)"
          onClick={onRedo}
          disabled={!canRedo}
          style={{ opacity: canRedo ? 1 : 0.35, cursor: canRedo ? 'pointer' : 'default' }}
        >
          <IconRedo />
        </button>
        <div className="topbar-divider" />
        <div
          className="status-dot"
          title={isConnected ? 'Connected' : 'Disconnected'}
          style={{ backgroundColor: isConnected ? '#2ecc71' : '#e74c3c' }}
        />
        <span className="topbar-canvas-name">Canvas · {id?.slice(0, 8)}…</span>
        <div className="topbar-menu-wrapper" ref={menuRef}>
          <button 
            className="topbar-btn" 
            title="More options" 
            onClick={() => setShowMenu(!showMenu)}
          >
            <IconDots />
          </button>
          {showMenu && (
             <div className="topbar-dropdown">
               <button 
                 className="dropdown-item"
                 onClick={() => {
                   setShowMenu(false);
                   onSaveAsTemplate?.();
                 }}
               >
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                   <rect x="9" y="9" width="6" height="6" />
                 </svg>
                 Save as Template
               </button>
             </div>
          )}
        </div>
      </div>

      <div className="editor-topbar-right">
        <button className="topbar-btn" title="Zoom out" onClick={onZoomOut}>−</button>
        <span className="topbar-canvas-name" style={{ minWidth: 42, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="topbar-btn"
          title="Zoom in"
          onMouseDown={(e) => {
            if (e.detail > 1) e.preventDefault();
            onZoomIn();
          }}
        >
          +
        </button>
        <div className="topbar-divider" />
        <button
          id="editor-share-btn"
          className="topbar-btn topbar-btn-accent"
          onClick={onShare}
          title="Share this project"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: 2 }}
          >
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
};
