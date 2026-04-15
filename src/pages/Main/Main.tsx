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
            <li className="active">Projects</li>
            <li>Settings</li>
          </ul>
        </div>
        
        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>
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
                <h3>{project.attributes.name}</h3>
                <p className="project-date">
                  Created: {new Date(project.attributes.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Project */}
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
