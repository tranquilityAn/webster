import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ImagePanel.css';

// ── Types ────────────────────────────────────────────────────────────────────

interface ImageItem {
  id: string;
  attributes: {
    name: string;
    url: string;
    key?: string;
    created_at: string;
  };
}

type Tab = 'presets' | 'uploads';

interface ImagePanelProps {
  onAddImage: (url: string, name: string) => void;
}

// ── Sub-components ───────────────────────────────────────────────────────────

const ImageSkeleton: React.FC = () => (
  <div className="img-panel-skeleton" aria-hidden="true">
    <div className="img-panel-skeleton-shimmer" />
  </div>
);

interface ImageTileProps {
  item: ImageItem;
  onAdd: (url: string, name: string) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

const ImageTile: React.FC<ImageTileProps> = ({ item, onAdd, onDelete }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const src = item.attributes.url || item.attributes.key || '';

  return (
    <div
      className="img-panel-tile"
      title={item.attributes.name}
      onClick={() => onAdd(src, item.attributes.name)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onAdd(src, item.attributes.name); }}
      aria-label={`Add image: ${item.attributes.name}`}
    >
      {/* Loading placeholder */}
      {!loaded && !error && <ImageSkeleton />}

      {error ? (
        <div className="img-panel-tile-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt={item.attributes.name}
          className={`img-panel-tile-img ${loaded ? 'loaded' : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
          draggable={false}
        />
      )}

      <div className="img-panel-tile-overlay">
        <span className="img-panel-tile-label">{item.attributes.name}</span>
      </div>

      {onDelete && (
        <button
          className="img-panel-tile-delete-btn"
          onClick={(e) => onDelete(item.id, e)}
          title="Delete image"
          aria-label="Delete image"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ── Upload tile ───────────────────────────────────────────────────────────────

interface UploadTileProps {
  /** Called when the file upload succeeds. Returns the newly created image item. */
  onUploaded: (item: ImageItem) => void;
}

const UploadTile: React.FC<UploadTileProps> = ({ onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `/webster/v1/images?name=${encodeURIComponent(file.name.replace(/\.[^.]+$/, ''))}`,
        { method: 'POST', body: formData }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.errors?.[0]?.detail ?? data?.message ?? 'Upload failed';
        throw new Error(typeof msg === 'string' ? msg : 'Upload failed');
      }

      const data = await res.json();
      onUploaded(data.data as ImageItem);
    } catch (err: any) {
      setError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div
      className={`img-panel-upload-zone ${uploading ? 'uploading' : ''}`}
      onClick={() => !uploading && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) inputRef.current?.click(); }}
      aria-label="Upload image"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
        id="img-panel-file-input"
      />

      {uploading ? (
        <div className="img-panel-upload-spinner">
          <div className="img-panel-spinner-ring" />
          <span>Uploading…</span>
        </div>
      ) : (
        <>
          <div className="img-panel-upload-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="img-panel-upload-label">Click or drag &amp; drop</p>
          <p className="img-panel-upload-hint">PNG, JPG, WEBP, SVG</p>
        </>
      )}

      {error && <p className="img-panel-upload-error">{error}</p>}
    </div>
  );
};

// ── Main Panel ────────────────────────────────────────────────────────────────

export const ImagePanel: React.FC<ImagePanelProps> = ({ onAddImage }) => {
  const [activeTab, setActiveTab] = useState<Tab>('presets');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/webster/v1/images?page[limit]=50');
      if (!res.ok) return;
      const data = await res.json();
      setImages(data.data ?? []);
    } catch {
      // silently fail — user can retry by switching tabs
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when switching to the uploads tab
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUploaded = useCallback((item: ImageItem) => {
    setImages((prev) => [item, ...prev]);
    setActiveTab('uploads');
  }, []);

  const handleDeleteImage = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick to place on canvas
    if (!window.confirm('Are you sure you want to delete this image from your uploads?')) return;

    try {
      const res = await fetch(`/webster/v1/images/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
      } else {
        console.error('Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }, []);

  // Split images into presets (not owned / "stock") and user uploads
  // Since the backend stores only user-owned images currently,
  // we treat all as uploads and show a curated Unsplash set for presets.
  const PRESET_IMAGES: ImageItem[] = [
    {
      id: 'preset-1',
      attributes: { name: 'Gradient Mesh', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80', created_at: '' },
    },
    {
      id: 'preset-2',
      attributes: { name: 'Night Sky', url: 'https://images.unsplash.com/photo-1504333638930-c8787321eee0?w=400&q=80', created_at: '' },
    },
    {
      id: 'preset-3',
      attributes: { name: 'Ocean Waves', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=80', created_at: '' },
    },
    {
      id: 'preset-4',
      attributes: { name: 'Mountain Fog', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80', created_at: '' },
    },
    {
      id: 'preset-5',
      attributes: { name: 'Neon City', url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80', created_at: '' },
    },
    {
      id: 'preset-6',
      attributes: { name: 'Forest Path', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80', created_at: '' },
    },
    {
      id: 'preset-7',
      attributes: { name: 'Desert Dunes', url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80', created_at: '' },
    },
    {
      id: 'preset-8',
      attributes: { name: 'Aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80', created_at: '' },
    },
    {
      id: 'preset-9',
      attributes: { name: 'Waterfall', url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=400&q=80', created_at: '' },
    },
    {
      id: 'preset-10',
      attributes: { name: 'Autumn Leaves', url: 'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=400&q=80', created_at: '' },
    },
    {
      id: 'preset-11',
      attributes: { name: 'Snowy Peak', url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&q=80', created_at: '' },
    },
    {
      id: 'preset-12',
      attributes: { name: 'Tropical Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80', created_at: '' },
    },
  ];

  return (
    <aside className="img-panel" aria-label="Images panel">
      {/* Header */}
      <div className="img-panel-header">
        <span className="img-panel-title">Images</span>
      </div>

      {/* Tab Switch */}
      <div className="img-panel-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'presets'}
          className={`img-panel-tab ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
          id="tab-presets"
          aria-controls="tabpanel-presets"
        >
          Presets
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'uploads'}
          className={`img-panel-tab ${activeTab === 'uploads' ? 'active' : ''}`}
          onClick={() => setActiveTab('uploads')}
          id="tab-uploads"
          aria-controls="tabpanel-uploads"
        >
          Uploads
        </button>
      </div>

      {/* Tab Content */}
      <div className="img-panel-body">
        {/* PRESETS tab */}
        <div
          id="tabpanel-presets"
          role="tabpanel"
          aria-labelledby="tab-presets"
          className={`img-panel-tabpanel ${activeTab === 'presets' ? 'active' : ''}`}
        >
          <div className="img-panel-grid">
            {PRESET_IMAGES.map((item) => (
              <ImageTile key={item.id} item={item} onAdd={onAddImage} />
            ))}
          </div>
        </div>

        {/* UPLOADS tab */}
        <div
          id="tabpanel-uploads"
          role="tabpanel"
          aria-labelledby="tab-uploads"
          className={`img-panel-tabpanel ${activeTab === 'uploads' ? 'active' : ''}`}
        >
          <UploadTile onUploaded={handleUploaded} />

          {loading ? (
            <div className="img-panel-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <ImageSkeleton key={i} />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="img-panel-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>No uploads yet</p>
              <p className="img-panel-empty-hint">Upload an image above to get started</p>
            </div>
          ) : (
            <div className="img-panel-grid">
              {images.map((item) => (
                <ImageTile 
                  key={item.id} 
                  item={item} 
                  onAdd={onAddImage} 
                  onDelete={handleDeleteImage} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
