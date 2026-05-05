import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Main.css';

interface Project {
  id: string;
  type: string;
  attributes: {
    name: string;
    created_at: string;
    updated_at: string;
  };
}

export default function Main() {
  const navigate = useNavigate();
  const { user, isLoading, setUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isOpeningEditor, setIsOpeningEditor] = useState<string | null>(null);

  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);
  
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState<string>('');
  const [templateTab, setTemplateTab] = useState<'public' | 'mine'>('public');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchTemplates();
    }
  }, [user]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch('/webster/v1/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/webster/v1/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeletingTemplate(true);
    try {
      const res = await fetch(`/webster/v1/templates/${templateToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete));
        if (selectedTemplate === templateToDelete) setSelectedTemplate('');
        setTemplateToDelete(null);
      } else {
        console.error('Failed to delete template');
      }
    } catch (err) {
      console.error('Failed to delete template', err);
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  const handleRenameTemplate = async (id: string) => {
    if (!editTemplateName.trim()) {
      setEditingTemplate(null);
      return;
    }
    
    try {
      const res = await fetch(`/webster/v1/templates/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            type: 'template',
            attributes: {
              name: editTemplateName.trim()
            }
          }
        })
      });
      if (res.ok) {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, attributes: { ...t.attributes, name: editTemplateName.trim() } } : t));
        setToastMessage('Template renamed');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        console.error('Failed to rename template');
      }
    } catch (err) {
      console.error('Failed to rename template', err);
    } finally {
      setEditingTemplate(null);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/webster/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            type: 'project',
            attributes: {
              name: newProjectName.trim(),
              ...(selectedTemplate ? { template_id: selectedTemplate } : {})
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const projectId = data.data.id;

        // Automatically create a default canvas for the new project
        const canvaRes = await fetch('/webster/v1/canvases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              type: 'canva',
              attributes: {
                project_id: projectId,
                name: 'Main Canvas',
              },
            },
          }),
        });

        if (canvaRes.ok) {
          const canvaData = await canvaRes.json();
          // Navigate directly to the editor and pass the selected template ID.
          // Since the backend currently ignores template_id for project/canva creation,
          // the frontend must re-apply the template body explicitly in the editor.
          if (selectedTemplate) {
            navigate(`/editor/${canvaData.data.id}`, { state: { templateId: selectedTemplate } });
          }
        }

        setNewProjectName('');
        setSelectedTemplate('');
        setShowCreateModal(false);
        fetchProjects();
      } else {
        const errData = await res.json();
        console.error('Failed to create project:', errData);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEditor = async (projectId: string) => {
    setIsOpeningEditor(projectId);
    try {
      // 1. Try to get existing canvases for this project
      const listRes = await fetch(`/webster/v1/canvases?project_id=${projectId}`);
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.data && listData.data.length > 0) {
          // Navigate to the first available canvas
          navigate(`/editor/${listData.data[0].id}`);
          return;
        }
      }

      // 2. If no canvas exists, create a default one
      const createRes = await fetch('/webster/v1/canvases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            type: 'canva',
            attributes: {
              project_id: projectId,
              name: 'Main Canvas'
            }
          }
        })
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        navigate(`/editor/${createData.data.id}`);
      } else {
        console.error('Failed to create default canvas');
      }
    } catch (error) {
      console.error('Error opening editor:', error);
    } finally {
      setIsOpeningEditor(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/webster/v1/accounts/logout', { method: 'POST' });
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
      setUser(null);
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="main-page-loading">
        <p style={{ color: '#EDE986' }}>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="main-layout">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <h3>Menu</h3>
          <ul className="sidebar-nav">
            <li className="active">
              <span className="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
              </span>
              Projects
            </li>
            <li>
              <span className="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              </span>
              Settings
            </li>
          </ul>
        </div>

        {/* Sidebar Waves Decoration */}
        <div className="sidebar-waves">
          <div className="wave"></div>
          <div className="wave"></div>
        </div>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="main-content">
        <div className="content-header">
          <h2>Your Projects</h2>
          <button
            className="create-project-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + New Project
          </button>
        </div>

        {loadingProjects ? (
          <p className="loading-text">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any projects yet.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div style={{ flex: 1 }}>
                  <h3>{project.attributes.name}</h3>
                  <p className="project-date">
                    Created: {new Date(project.attributes.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="open-editor-btn"
                  onClick={() => handleOpenEditor(project.id)}
                  disabled={isOpeningEditor === project.id}
                >
                  {isOpeningEditor === project.id ? 'Opening...' : 'Open Editor'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="close-btn" onClick={() => {
                setShowCreateModal(false);
                setNewProjectName('');
                setSelectedTemplate('');
              }}>&times;</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="projectName">Project Name / User Name</label>
                <input
                  id="projectName"
                  type="text"
                  placeholder="Enter project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                />
              </div>

              {templates.length > 0 && (
                <div className="form-group">
                  <label>Select Template (Optional)</label>

                  {/* Tab Switch */}
                  <div className="template-tab-switch">
                    <button
                      type="button"
                      className={`template-tab-btn ${templateTab === 'public' ? 'active' : ''}`}
                      onClick={() => { setTemplateTab('public'); setSelectedTemplate(''); }}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      className={`template-tab-btn ${templateTab === 'mine' ? 'active' : ''}`}
                      onClick={() => { setTemplateTab('mine'); setSelectedTemplate(''); }}
                    >
                      My Templates
                    </button>
                  </div>

                  <div className="template-tiles-container">
                    {templates
                      .filter(tpl =>
                        templateTab === 'mine'
                          ? tpl.attributes.account_id === user?.id
                          : tpl.attributes.account_id !== user?.id || tpl.attributes.public
                      )
                      .map((tpl) => {
                      const width = tpl.attributes.body?.attrs?.width || 1280;
                      const height = tpl.attributes.body?.attrs?.height || 720;
                      const aspect = width / height;
                      
                      let boxWidth = 30;
                      let boxHeight = 30;
                      if (aspect > 1) {
                        boxHeight = 30 / aspect;
                      } else {
                        boxWidth = 30 * aspect;
                      }

                      return (
                        <div 
                          key={tpl.id}
                          className={`template-tile ${selectedTemplate === tpl.id ? 'selected' : ''}`}
                          onClick={() => setSelectedTemplate(tpl.id)}
                        >
                          <div className="template-ratio-preview">
                            <div className="template-ratio-box" style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}></div>
                          </div>
                          <div className="template-info" style={{ flex: 1, minWidth: 0 }}>
                            {editingTemplate === tpl.id ? (
                              <input
                                autoFocus
                                className="template-rename-input"
                                value={editTemplateName}
                                onChange={e => setEditTemplateName(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                onBlur={() => handleRenameTemplate(tpl.id)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameTemplate(tpl.id);
                                  if (e.key === 'Escape') setEditingTemplate(null);
                                }}
                              />
                            ) : (
                              <div className="template-name" title={tpl.attributes.name}>{tpl.attributes.name}</div>
                            )}
                            <div className="template-dims">{width} x {height} px</div>
                          </div>
                          {tpl.attributes.account_id === user?.id && (
                            <div className="template-actions" style={{ display: 'flex', gap: '4px' }}>
                              {editingTemplate === tpl.id ? (
                                <button
                                  className="template-action-btn confirm-btn"
                                  title="Confirm"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRenameTemplate(tpl.id);
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="template-action-btn"
                                    title="Rename template"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTemplate(tpl.id);
                                      setEditTemplateName(tpl.attributes.name);
                                    }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 20h9" />
                                      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                  </button>
                                  <button
                                    className="template-action-btn delete-btn"
                                    title="Delete template"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTemplateToDelete(tpl.id);
                                    }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName('');
                    setSelectedTemplate('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isCreating || !newProjectName.trim()}
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      {templateToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <h2 className="modal-title">Delete Template</h2>
            <p className="modal-subtitle">Are you sure you want to delete this template? This action cannot be undone.</p>
            
            <div className="modal-actions" style={{ marginTop: 32 }}>
              <button 
                className="cancel-btn" 
                onClick={() => setTemplateToDelete(null)}
                disabled={isDeletingTemplate}
              >
                Cancel
              </button>
              <button
                className="submit-btn"
                style={{ backgroundColor: '#ff5252', color: '#1A1A1A' }}
                onClick={handleDeleteTemplate}
                disabled={isDeletingTemplate}
              >
                {isDeletingTemplate ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`toast-notification ${toastMessage ? 'show' : ''}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {toastMessage}
      </div>
    </div>
  );
}
