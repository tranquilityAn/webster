import React from 'react';
import { IconUndo, IconRedo } from './EditorIcons';

interface TopBarProps {
  isConnected: boolean;
  id?: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onShare: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isConnected,
  id,
  zoom,
  onZoomIn,
  onZoomOut,
  onShare,
}) => {
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
