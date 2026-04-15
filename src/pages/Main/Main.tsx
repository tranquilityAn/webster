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
          <button className="create-project-btn">+ New Project</button>
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
    </div>
  );
}
