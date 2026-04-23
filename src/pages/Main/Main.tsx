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
  const [isCreating, setIsCreating] = useState(false);
  const [isOpeningEditor, setIsOpeningEditor] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
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
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const projectId = data.data.id;

        // Automatically create a default canvas for the new project
        await fetch('/webster/v1/canvases', {
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

        setNewProjectName('');
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
              }}>&times;</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="projectName">Project Name</label>
                <input
                  id="projectName"
                  type="text"
                  placeholder="Enter project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName('');
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
    </div>
  );
}
