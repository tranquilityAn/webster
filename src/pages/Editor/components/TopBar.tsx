import React from 'react';
import { IconUndo, IconRedo } from './EditorIcons';

interface TopBarProps {
  isConnected: boolean;
  id?: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onTestCommit: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isConnected,
  id,
  zoom,
  onZoomIn,
  onZoomOut,
  onTestCommit,
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
        <button className="topbar-btn" title="Zoom in" onMouseDown={(e) => {
          // Prevent accidental double clicks from selecting text
          if (e.detail > 1) e.preventDefault();
          onZoomIn();
        }}>
          +
        </button>
        <div className="topbar-divider" />
        <button
          className="topbar-btn topbar-btn-accent"
          onClick={onTestCommit}
          disabled={!isConnected}
          title="Send a test commit to canvas"
        >
          Test Commit
        </button>
      </div>
    </div>
  );
};
