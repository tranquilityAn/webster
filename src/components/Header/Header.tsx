import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to="/" className="logo-link">
          <img src="/logo.svg" alt="Webster Logo" className="header-logo" />
        </Link>
        
        {user && (
          <div className="header-user">
            <span className="user-name">{user.attributes.username || user.attributes.email}</span>
            <div className="user-avatar">
              {user.attributes.avatarUrl || user.attributes.avatarKey ? (
                <img src={user.attributes.avatarUrl || user.attributes.avatarKey} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">{getInitials(user.attributes.username)}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
