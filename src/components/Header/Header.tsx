import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccountModal from './AccountModal';
import './Header.css';

export default function Header() {
  const { user } = useAuth();
  const [showAccountModal, setShowAccountModal] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <header className="main-header">
        <div className="header-container">
          <Link to="/" className="logo-link">
            <img src="/logo.svg" alt="Webster Logo" className="header-logo" />
          </Link>

          {user && (
            <button
              className="header-user-btn"
              onClick={() => setShowAccountModal(true)}
              aria-label="Open account settings"
              id="header-account-btn"
            >
              <span className="user-name">{user.attributes.username || user.attributes.email}</span>
              <div className="user-avatar">
                {user.attributes.avatarUrl || user.attributes.avatarKey ? (
                  <img src={user.attributes.avatarUrl || user.attributes.avatarKey} alt="Avatar" />
                ) : (
                  <div className="avatar-placeholder">{getInitials(user.attributes.username)}</div>
                )}
              </div>
            </button>
          )}
        </div>
      </header>

      {showAccountModal && (
        <AccountModal onClose={() => setShowAccountModal(false)} />
      )}
    </>
  );
}
