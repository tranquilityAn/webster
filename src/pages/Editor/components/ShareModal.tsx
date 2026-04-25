import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ShareModal.css';

interface ShareModalProps {
  projectId: string;
  onClose: () => void;
}

interface Member {
  id: string;
  attributes: {
    account_id: string;
    project_id: string;
    role: 'owner' | 'editor' | 'viewer';
    created_at: string;
    updated_at: string;
  };
  // resolved display name (from profiles)
  displayName?: string;
}

type InviteStatus = 'idle' | 'loading' | 'success' | 'error';
type RoleUpdateState = Record<string, 'loading' | 'error' | undefined>;

const ROLE_LABELS: Record<string, string> = {
  owner:  'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
};

const ROLE_ORDER = ['owner', 'editor', 'viewer'];

export const ShareModal: React.FC<ShareModalProps> = ({ projectId, onClose }) => {
  const [email, setEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>('idle');
  const [inviteError, setInviteError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [roleUpdateState, setRoleUpdateState] = useState<RoleUpdateState>({});

  // ── Focus input on mount ────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // ── Close on Escape ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // ── Fetch members ───────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const res = await fetch(`/webster/v1/projects/${projectId}/members`);
      if (!res.ok) return;
      const data = await res.json();
      const rawMembers: Member[] = data.data || [];

      // Attempt to resolve display names from profiles endpoint
      const enriched = await Promise.all(
        rawMembers.map(async (m) => {
          try {
            const pRes = await fetch(`/webster/v1/profiles/${m.attributes.account_id}`);
            if (pRes.ok) {
              const pData = await pRes.json();
              const username = pData?.data?.attributes?.username;
              const email    = pData?.data?.attributes?.email;
              return { ...m, displayName: username || email || m.attributes.account_id.slice(0, 8) };
            }
          } catch { /* ignore */ }
          return { ...m, displayName: m.attributes.account_id.slice(0, 8) };
        })
      );

      // Sort: owner first, then editor, then viewer
      enriched.sort((a, b) =>
        ROLE_ORDER.indexOf(a.attributes.role) - ROLE_ORDER.indexOf(b.attributes.role)
      );
      setMembers(enriched);
    } catch { /* ignore */ } finally {
      setMembersLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // ── Send invite ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || inviteStatus === 'loading') return;

    setInviteStatus('loading');
    setInviteError('');

    try {
      const res = await fetch(`/webster/v1/projects/${projectId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            type: 'project_invite',
            attributes: { email: email.trim() },
          },
        }),
      });

      if (res.ok) {
        setInviteStatus('success');
        // After a successful invite the member list doesn't change yet (invite pending),
        // but refresh anyway so that if the user is already a member we show the conflict.
      } else {
        const data = await res.json().catch(() => ({}));
        let msg = 'Something went wrong. Please try again.';
        if (data?.errors?.[0]?.detail)            msg = data.errors[0].detail;
        else if (Array.isArray(data?.message))    msg = data.message[0];
        else if (typeof data?.message === 'string') msg = data.message;
        else if (typeof data?.error === 'string')   msg = data.error;
        setInviteError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        setInviteStatus('error');
      }
    } catch {
      setInviteError('Network error. Please check your connection.');
      setInviteStatus('error');
    }
  };

  const handleSendAnother = () => {
    setEmail('');
    setInviteStatus('idle');
    setInviteError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Update member role ──────────────────────────────────────────────────────
  const handleRoleChange = async (member: Member, newRole: 'editor' | 'viewer') => {
    if (member.attributes.role === newRole) return;

    setRoleUpdateState(prev => ({ ...prev, [member.id]: 'loading' }));

    try {
      const res = await fetch(`/webster/v1/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            id: member.id,
            type: 'project_member',
            attributes: { role: newRole },
          },
        }),
      });

      if (res.ok) {
        setMembers(prev =>
          prev.map(m =>
            m.id === member.id
              ? { ...m, attributes: { ...m.attributes, role: newRole } }
              : m
          )
        );
        setRoleUpdateState(prev => { const s = { ...prev }; delete s[member.id]; return s; });
      } else {
        setRoleUpdateState(prev => ({ ...prev, [member.id]: 'error' }));
        setTimeout(() => {
          setRoleUpdateState(prev => { const s = { ...prev }; delete s[member.id]; return s; });
        }, 2000);
      }
    } catch {
      setRoleUpdateState(prev => ({ ...prev, [member.id]: 'error' }));
      setTimeout(() => {
        setRoleUpdateState(prev => { const s = { ...prev }; delete s[member.id]; return s; });
      }, 2000);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="share-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="share-modal-content">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="share-modal-header">
          <div className="share-modal-title-group">
            <div className="share-modal-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <h2 id="share-modal-title">Share Project</h2>
              <p className="share-modal-subtitle">
                Invite collaborators — they'll receive a 24-hour link.
              </p>
            </div>
          </div>
          <button className="share-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* ── Invite form / success ───────────────────────────────────────── */}
        {inviteStatus === 'success' ? (
          <div className="share-success-state">
            <div className="share-success-icon">✓</div>
            <p className="share-success-title">Invitation sent!</p>
            <p className="share-success-desc">
              An invite email was sent to <strong>{email}</strong>.
            </p>
            <div className="share-success-actions">
              <button className="share-btn-secondary" onClick={handleSendAnother}>
                Invite another
              </button>
              <button className="share-btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="share-form-group">
              <label htmlFor="invite-email">Invite by email</label>
              <div className={`share-input-row`}>
                <div className={`share-input-wrap ${inviteStatus === 'error' ? 'has-error' : ''}`}>
                  <svg className="share-input-icon" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    id="invite-email"
                    ref={inputRef}
                    type="email"
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (inviteStatus === 'error') { setInviteStatus('idle'); setInviteError(''); }
                    }}
                    disabled={inviteStatus === 'loading'}
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  id="share-send-invite-btn"
                  className="share-btn-primary share-inline-btn"
                  disabled={!email.trim() || inviteStatus === 'loading'}
                >
                  {inviteStatus === 'loading'
                    ? <><span className="share-spinner" /> Sending…</>
                    : 'Send Invite'}
                </button>
              </div>
              {inviteStatus === 'error' && inviteError && (
                <p className="share-error-msg">{inviteError}</p>
              )}
            </div>
          </form>
        )}

        {/* ── Members list ───────────────────────────────────────────────── */}
        <div className="share-members-section">
          <div className="share-members-header">
            <span className="share-members-title">Project members</span>
            <span className="share-members-count">{members.length}</span>
          </div>

          {membersLoading ? (
            <div className="share-members-loading">
              <div className="share-spinner share-spinner--dark" />
              <span>Loading members…</span>
            </div>
          ) : members.length === 0 ? (
            <p className="share-members-empty">No members found.</p>
          ) : (
            <ul className="share-members-list">
              {members.map((member) => {
                const isOwner = member.attributes.role === 'owner';
                const updateState = roleUpdateState[member.id];

                return (
                  <li key={member.id} className="share-member-item">
                    {/* Avatar */}
                    <div className="share-member-avatar" aria-hidden="true">
                      {(member.displayName || '?')[0].toUpperCase()}
                    </div>

                    {/* Name + account_id hint */}
                    <div className="share-member-info">
                      <span className="share-member-name">{member.displayName}</span>
                      <span className="share-member-sub">
                        {member.attributes.account_id.slice(0, 8)}…
                      </span>
                    </div>

                    {/* Role selector / badge */}
                    <div className="share-member-role-wrap">
                      {isOwner ? (
                        <span className="share-role-badge share-role-badge--owner">
                          {ROLE_LABELS[member.attributes.role]}
                        </span>
                      ) : (
                        <div className={`share-role-select-wrap ${updateState === 'loading' ? 'is-updating' : ''} ${updateState === 'error' ? 'has-error' : ''}`}>
                          {updateState === 'loading' && (
                            <span className="share-spinner share-spinner--tiny" />
                          )}
                          <select
                            className="share-role-select"
                            value={member.attributes.role}
                            disabled={updateState === 'loading'}
                            onChange={(e) =>
                              handleRoleChange(member, e.target.value as 'editor' | 'viewer')
                            }
                            aria-label={`Role for ${member.displayName}`}
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <svg className="share-select-chevron" width="12" height="12"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};
