import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
// import './LoginPage.css'; // Reusing auth page styles

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch CSRF token on load
  useEffect(() => {
    const getCsrfToken = async () => {
      try {
        const { data } = await axios.get('/api/auth/csrf-token');
        axios.defaults.headers.common['X-CSRF-Token'] = data.csrfToken;
      } catch (err) {
        setError('A wittle security error occurred! Please refresh the page, cutie. >.<');
      }
    };
    getCsrfToken();
  }, []);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/request-password-reset', { email });
      // To prevent email enumeration, we show a success message even if the email doesn't exist.
      setMessage(response.data.message || 'If that email is in our system, a reset link has been sent! Check your inbox, sweetie! 💕');
    } catch (err) {
      // This would typically only catch network errors, as the backend should always return success.
      setError(err.response?.data?.message || 'Something went wrong on our end, sowwy! T-Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page forgot-password-page">
      <div id="stars-container-colorful"></div>
      <Link to="/login" className="btn-back-home">« Back to Login!</Link>

      <div className="auth-container">
        <main className="auth-main">
          <div className="auth-card card">
            <div className="card-header">
              <h2><span>Forgot Your Passy?</span></h2>
              <p>It's okay, happens to the best of us! *giggles* <br/> Just pop your email below!</p>
            </div>

            {error && <div className="message-area error" style={{display: 'block'}}>{error}</div>}
            {message && <div className="message-area success" style={{display: 'block'}}>{message}</div>}

            <form onSubmit={handleRequestReset}>
              <div className="form-group">
                <label htmlFor="email">Your Super Cute Email~</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="e.g., cutiepie@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || !!message} // Disable after sending
                />
              </div>

              <button type="submit" className="btn auth-btn-primary" disabled={loading || !!message}>
                {loading ? 'Sending...' : 'Send Reset Link! 💌'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
