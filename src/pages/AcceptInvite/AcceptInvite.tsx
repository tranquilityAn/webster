import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AcceptInvite.css';

type PageState = 'loading' | 'accepting' | 'success' | 'error';

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth check to finish
    if (authLoading) return;

    // If not authenticated, redirect to login with returnTo query param
    if (!user) {
      navigate(`/login?returnTo=/projects/invite/${token}`, { replace: true });
      return;
    }

    // Fire the accept request
    acceptInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const acceptInvite = async () => {
    if (!token) {
      setErrorMessage('Invalid invite link.');
      setPageState('error');
      return;
    }

    setPageState('accepting');

    try {
      const res = await fetch(`/webster/v1/projects/invites/${token}/accept`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        // Try to extract project name from the response relationships / included
        const pName =
          data?.data?.relationships?.project?.data?.attributes?.name ||
          null;
        setProjectName(pName);
        setPageState('success');
      } else {
        const data = await res.json().catch(() => ({}));
        
        let msg = 'This invite is invalid, has expired, or was sent to a different email address.';
        
        if (data?.errors?.[0]?.detail) {
          msg = data.errors[0].detail;
        } else if (Array.isArray(data?.message)) {
          msg = data.message[0];
        } else if (typeof data?.message === 'string') {
          msg = data.message;
        } else if (typeof data?.error === 'string') {
          msg = data.error;
        }

        setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
        setPageState('error');
      }
    } catch {
      setErrorMessage('A network error occurred. Please check your connection and try again.');
      setPageState('error');
    }
  };

  return (
    <div className="accept-invite-page">
      <div className="accept-invite-glow" />

      <div className="accept-invite-card">
        {/* Webster logo / wordmark */}
        <div className="accept-invite-brand">
          <span className="accept-invite-wordmark">webster</span>
        </div>

        {/* Loading / Accepting */}
        {(pageState === 'loading' || pageState === 'accepting') && (
          <div className="accept-invite-state">
            <div className="accept-spinner-wrap">
              <div className="accept-spinner" />
            </div>
            <h1 className="accept-invite-title">
              {pageState === 'loading' ? 'Checking your invite…' : 'Joining project…'}
            </h1>
            <p className="accept-invite-desc">
              Please wait a moment while we process your invitation.
            </p>
          </div>
        )}

        {/* Success */}
        {pageState === 'success' && (
          <div className="accept-invite-state">
            <div className="accept-status-icon accept-status-icon--success">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="accept-invite-title">You're in!</h1>
            <p className="accept-invite-desc">
              {projectName
                ? <>You've successfully joined <strong>{projectName}</strong>.</>
                : <>You've successfully joined the project.</>}
              {' '}You can now view and collaborate on its canvases.
            </p>
            <div className="accept-invite-actions">
              <button
                id="accept-invite-go-dashboard"
                className="accept-btn-primary"
                onClick={() => navigate('/')}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {pageState === 'error' && (
          <div className="accept-invite-state">
            <div className="accept-status-icon accept-status-icon--error">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 className="accept-invite-title">Invite unavailable</h1>
            <p className="accept-invite-desc">{errorMessage}</p>
            <div className="accept-invite-actions">
              <button
                id="accept-invite-go-dashboard-error"
                className="accept-btn-secondary"
                onClick={() => navigate('/')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
