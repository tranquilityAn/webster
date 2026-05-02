import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AccountModal.css';

type Tab = 'profile' | 'password';

interface AccountModalProps {
  onClose: () => void;
}

const extractErrorMsg = (data: any, fallback: string): string => {
  if (!data) return fallback;
  const detail = data?.errors?.[0]?.detail;
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'object' && detail !== null) {
    if (Array.isArray(detail.message)) return String(detail.message[0]);
    if (typeof detail.message === 'string') return detail.message;
    if (typeof detail.error === 'string') return detail.error;
  }
  if (Array.isArray(data.message)) return String(data.message[0]);
  if (typeof data.message === 'string') return data.message;
  return fallback;
};

export default function AccountModal({ onClose }: AccountModalProps) {
  const { user, checkAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile tab state
  const [username, setUsername] = useState(user?.attributes.username ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const currentAvatar = avatarPreview || user?.attributes.avatarUrl || user?.attributes.avatarKey;

  // ---- Avatar upload ----
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    setProfileMsg(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/webster/v1/profiles/me/avatar', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await checkAuth();
        setProfileMsg({ text: 'Avatar updated successfully', ok: true });
      } else {
        const data = await res.json();
        setProfileMsg({ text: extractErrorMsg(data, 'Failed to upload avatar'), ok: false });
        setAvatarPreview(null);
      }
    } catch {
      setProfileMsg({ text: 'Network error', ok: false });
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ---- Save username ----
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/webster/v1/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            id: user.id,
            type: 'profile',
            attributes: { username: username.trim() || undefined },
          },
        }),
      });
      if (res.ok) {
        await checkAuth();
        setProfileMsg({ text: 'Profile updated successfully', ok: true });
      } else {
        const data = await res.json();
        setProfileMsg({ text: extractErrorMsg(data, 'Failed to update profile'), ok: false });
      }
    } catch {
      setProfileMsg({ text: 'Network error', ok: false });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ---- Change password ----
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match', ok: false });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters', ok: false });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch('/webster/v1/accounts/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            type: 'account',
            attributes: { currentPassword, newPassword },
          },
        }),
      });
      if (res.ok || res.status === 204) {
        setPasswordMsg({ text: 'Password changed successfully', ok: true });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json().catch(() => ({}));
        setPasswordMsg({ text: extractErrorMsg(data, 'Failed to change password'), ok: false });
      }
    } catch {
      setPasswordMsg({ text: 'Network error', ok: false });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="account-modal-overlay" onClick={handleOverlayClick}>
      <div className="account-modal-content">
        {/* Header */}
        <div className="account-modal-header">
          <h2>My Account</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Avatar section */}
        <div className="account-avatar-section">
          <div
            className="account-avatar-wrapper"
            onClick={() => fileInputRef.current?.click()}
            title="Click to change avatar"
          >
            {currentAvatar ? (
              <img src={currentAvatar} alt="Avatar" className="account-avatar-img" />
            ) : (
              <div className="account-avatar-placeholder">
                {getInitials(user?.attributes.username)}
              </div>
            )}
            <div className="account-avatar-overlay">
              {isUploadingAvatar ? (
                <span className="upload-spinner" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
            id="account-avatar-input"
          />
          <div className="account-user-info">
            <p className="account-display-name">{user?.attributes.username ?? 'User'}</p>
            <p className="account-display-email">{user?.attributes.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="account-tabs">
          <button
            className={`account-tab${activeTab === 'profile' ? ' active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`account-tab${activeTab === 'password' ? ' active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
        </div>

        {/* Tabs Content Area */}
        <div className="account-tab-content-wrapper">
          {/* Profile tab */}
          <div className={`account-tab-pane ${activeTab === 'profile' ? 'active' : ''}`}>
            <div className="account-tab-inner">
              <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label htmlFor="account-username">Username</label>
                <input
                  id="account-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  minLength={3}
                  maxLength={32}
                />
              </div>
              {profileMsg && (
                <p className={`account-msg${profileMsg.ok ? ' ok' : ' err'}`}>{profileMsg.text}</p>
              )}
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSavingProfile || !username.trim() || username.trim() === (user?.attributes.username ?? '')}
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              </form>
            </div>
          </div>

          {/* Password tab */}
          <div className={`account-tab-pane ${activeTab === 'password' ? 'active' : ''}`}>
            <div className="account-tab-inner">
              <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="account-current-password">Current Password</label>
              <input
                id="account-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="account-new-password">New Password</label>
              <input
                id="account-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="account-confirm-password">Confirm New Password</label>
              <input
                id="account-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>
            {passwordMsg && (
              <p className={`account-msg${passwordMsg.ok ? ' ok' : ' err'}`}>{passwordMsg.text}</p>
            )}
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {isSavingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
