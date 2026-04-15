import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Register/Register.css'; // Reusing minimalist auth styles

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Send the verification email request when page loads
  useEffect(() => {
    const sendVerificationRequest = async () => {
      try {
        await fetch('/webster/v1/accounts/me/verify-email', { method: 'POST' });
        setStatus('A verification code has been sent to your email.');
      } catch (error) {
        console.error('Failed to send verification request on load:', error);
      }
    };
    sendVerificationRequest();
  }, []);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('Verifying code...');

    try {
      const res = await fetch('/webster/v1/accounts/me/verify-email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            type: 'account',
            attributes: { code }
          }
        })
      });

      console.log('Verify Response:', res.status, res.statusText);

      if (res.ok) {
        setStatus('Email verified successfully!');
        setTimeout(() => navigate('/'), 1500);
      } else {
        const errorData = await res.json().catch(() => null);
        console.error('Verify Error:', errorData);
        setStatus(`Error: ${errorData?.errors?.[0]?.detail || 'Invalid or expired code'}`);
      }
    } catch (error: any) {
      console.error(error);
      setStatus(`Network Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Verify Email</h1>
        <p className="auth-subtitle">Check your inbox for the 6-digit code</p>
        
        <form className="auth-form" onSubmit={handleConfirm}>
          <div className="input-group">
            <label htmlFor="code">Confirmation Code</label>
            <input 
              type="text" 
              id="code" 
              name="code" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              required 
              maxLength={6}
              minLength={6}
              pattern="[0-9]{6}"
              placeholder="123456"
              style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading || code.length !== 6}>
            {isLoading ? 'Verifying...' : 'Confirm'}
          </button>
        </form>

        {status && <div className="status-message">{status}</div>}
      </div>
    </div>
  );
}
