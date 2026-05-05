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
}

export const TopBar: React.FC<TopBarProps> = ({
  isConnected,
  id,
  zoom,
  onZoomIn,
  onZoomOut,
  onShare,
  onSaveAsTemplate,
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
        <div className="topbar-menu-wrapper" style={{ position: 'relative' }} ref={menuRef}>
          <button 
            className="topbar-btn" 
            title="More options" 
            onClick={() => setShowMenu(!showMenu)}
            style={{ marginLeft: 4 }}
          >
            <IconDots />
          </button>
          {showMenu && (
             <div className="topbar-dropdown" style={{
               position: 'absolute',
               top: '100%',
               left: 0,
               marginTop: 8,
               backgroundColor: '#252525',
               border: '1px solid #333',
               borderRadius: 8,
               padding: 4,
               minWidth: 160,
               boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
               zIndex: 1000
             }}>
               <button 
                 className="dropdown-item"
                 onClick={() => {
                   setShowMenu(false);
                   onSaveAsTemplate?.();
                 }}
                 style={{
                   width: '100%',
                   textAlign: 'left',
                   padding: '8px 12px',
                   background: 'transparent',
                   border: 'none',
                   color: '#f5f5f5',
                   cursor: 'pointer',
                   borderRadius: 4,
                   fontSize: '0.9rem'
                 }}
                 onMouseEnter={e => e.currentTarget.style.backgroundColor = '#333'}
                 onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
               >
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
