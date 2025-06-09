import React, { useState, useEffect } from 'react';
// --- FIX: Import our magical API instance instead of the plain one! ---
import API from '../api/axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError("It looks like your reset link is missing its magic sparkle! ✨ Please request a new one.");
    }
    // --- FIX: We don't need to get the CSRF token anymore! It's automatic! ---
  }, [token]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Your passwords don't match, silly! Try again~");
      return;
    }
    if (password.length < 8) {
      setError("Your password needs to be at least 8 characters long, hun!");
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      // --- FIX: Use our API instance which handles tokens automatically! ---
      const response = await API.post('/auth/reset-password', { token, password, confirmPassword });
      setMessage(response.data.message + " Redirecting you to login now, cutie pie! ;3");
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong! Maybe the link expired?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page reset-password-page">
      {/* You should add your cute starry background component here! */}
      <Link to="/" className="btn-back-home">« Back to Home</Link>

      <div className="auth-container">
        <main className="auth-main">
          <div className="auth-card card">
            <div className="card-header">
              <h2><span>Create a New Secret! 🤫</span></h2>
              <p>Time for a new password! Make it super cute and strong!</p>
            </div>

            {error && <div className="message-area error" style={{display: 'block'}}>{error}</div>}
            {message && <div className="message-area success" style={{display: 'block'}}>{message}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="newPassword">New Super Secret Password</label>
                <input type="password" id="newPassword" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="8" disabled={loading || !!message} />
              </div>
              <div className="form-group">
                <label htmlFor="confirmNewPassword">Confirm the Secret! *wink*</label>
                <input type="password" id="confirmNewPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength="8" disabled={loading || !!message} />
              </div>

              <button type="submit" className="btn auth-btn-primary" disabled={!token || loading || !!message}>
                {loading ? 'Saving...' : 'Set New Password! 💖'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
