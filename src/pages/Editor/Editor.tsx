import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCanvasStore } from '../../store/useCanvasStore';
import './Editor.css';

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    isConnected, 
    snapshot, 
    commits, 
    error, 
    connect, 
    disconnect, 
    sendCommit 
  } = useCanvasStore();

  useEffect(() => {
    if (id) {
      connect(id);
    }
    return () => {
      disconnect();
    };
  }, [id, connect, disconnect]);

  const handleTestCommit = () => {
    // Generate a test commit (adding a random rectangle)
    const newChange = {
      op: 'add',
      parentId: 'layer-1', // Assuming there's a layer-1 in the snapshot. Fallback if not needed.
      node: {
        className: 'Rect',
        attrs: {
          id: `rect-${Date.now()}`,
          x: Math.floor(Math.random() * 500) + 50,
          y: Math.floor(Math.random() * 300) + 50,
          width: 80,
          height: 80,
          fill: '#' + Math.floor(Math.random()*16777215).toString(16)
        }
      }
    };
    sendCommit([newChange]);
  };

  return (
    <div className="editor-page">
      <div className="editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>
            ← Back
          </button>
          <h2 style={{ margin: 0 }}>Canvas Editor Stub</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span className={`status-badge ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span style={{ fontSize: '12px', color: '#888' }}>ID: {id}</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="editor-content">
        <div className="canvas-placeholder">
          <h3>Visual Canvas Area</h3>
          <p style={{ color: '#888', marginBottom: '20px' }}>
            Normally real-time rendering happens here. Instead of a full canvas, we have a mock interaction button.
          </p>
          <button 
            className="btn-commit" 
            onClick={handleTestCommit}
            disabled={!isConnected}
          >
            Send Test Commit (Add Random Rect)
          </button>
        </div>

        <div className="state-inspector">
          <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '10px', marginTop: 0 }}>
            Socket State Inspector
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <strong style={{ color: '#E74C3C' }}>Snapshot Version:</strong> {snapshot?.version ?? 'N/A'}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <strong style={{ color: '#F1C40F' }}>Commits Un-Snapshotted:</strong> {commits.length}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <strong style={{ color: '#3498DB' }}>Latest Commit Details:</strong>
            <pre style={{ overflowX: 'auto', padding: '10px', backgroundColor: '#0a0a0a', borderRadius: '4px', margin: '5px 0' }}>
              {commits.length > 0 
                ? JSON.stringify(commits[commits.length - 1], null, 2) 
                : 'No commits received yet'}
            </pre>
          </div>

          <div>
            <strong style={{ color: '#2ECC71' }}>Base Snapshot State:</strong>
            <pre style={{ overflowX: 'auto', padding: '10px', backgroundColor: '#0a0a0a', borderRadius: '4px', margin: '5px 0' }}>
              {snapshot ? JSON.stringify(snapshot.body, null, 2) : 'Loading snapshot...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
