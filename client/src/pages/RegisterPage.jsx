import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// --- FIX: We only need to import our super cute useAuth hook now! ---
import { useAuth } from '../hooks/useAuth';

// You might need to adjust these styles to match your page perfectly!
const RegisterStyles = () => (
    <style>{`
        .auth-page { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh; padding: 1rem; padding-top: 10vh; }
        .auth-container { width: 100%; display: flex; justify-content: center; align-items: center; }
        .auth-main { width: 100%; max-width: 450px; }
        .auth-card { background-color: var(--card-bg); border: 1px solid var(--card-border); border-radius: 20px; padding: 2rem 2.5rem; width: 100%; box-shadow: var(--shadow-lg), 0 0 20px rgba(var(--highlight-rgb), 0.15); text-align: center; position: relative; z-index: 1; animation: fadeInCard 0.5s ease-out; }
        .auth-card .card-header h2 { font-family: var(--font-pixel); color: var(--text-primary); text-shadow: 0 0 8px var(--accent-lavender); margin-bottom: 0.25rem; font-size: 1.6rem; }
        .auth-card .card-header p { font-size: 1rem; margin-top: 0.5rem; margin-bottom: 1.5rem; color: var(--text-secondary); line-height: 1.5; }
        .auth-card form { text-align: left; }
        .form-group { width: 100%; margin-bottom: 1.5rem; }
        .form-group label { font-weight: 600; display: block; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.9rem; }
        .form-group input:focus { border-color: var(--accent-pink); box-shadow: 0 0 0 3px rgba(var(--accent-pink-rgb), 0.25); }
        .auth-btn-primary { display: block; width: 100%; margin-top: 1.5rem; font-family: var(--font-pixel); font-size: 1rem; border-radius: 20px; color: var(--text-dark); padding: 14px 20px; }
        .auth-footer-links { margin-top: 1.5rem; font-size: 0.9em; }
        .auth-footer-links p { color: var(--text-secondary); }
        .auth-footer-links a { color: var(--accent-pink); font-weight: 600; }
        .btn-back-home { position: absolute; top: 5rem; left: 1.5rem; background-color: var(--card-bg); border: 1px solid var(--card-border); color: var(--accent-lavender); border-radius: 12px; font-size: 0.9rem; padding: 10px 16px; text-decoration: none; z-index: 10; transition: all 0.2s ease-in-out; box-shadow: var(--shadow-md); }
        .btn-back-home:hover { background-color: rgba(var(--accent-lavender-rgb), 0.1); color: var(--accent-pink); transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    `}</style>
);


function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- FIX: Get the new register function from our hook! ---
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // --- FIX: So simple now! The register function handles everything! ---
      await register(email, password);
      // The useAuth hook will navigate us to the verify page on success!
    } catch (err) {
      const message = err.message || 'An unexpected error occurred.';
      setError(message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="auth-page register-page">
      <RegisterStyles />
      {/* You can add your starry background component here if you want! */}
      <Link to="/" className="btn-back-home">« Back to Home</Link>

      <div className="auth-container">
        <main className="auth-main">
          <div className="auth-card card">
            <div className="card-header">
              <h2><span>Join the Fun! 🎉</span></h2>
              <p>Let's get you all set up, cutie!</p>
            </div>

            {error && <div className="message-area error" style={{display: 'block'}}>{error}</div>}

            <form id="registerForm" onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="email">Your Cutie Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="e.g., sparkle@example.com"
                  className="selectable"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Choose a Secret Password</label>
                 <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    placeholder="Make it something cute! 🤫"
                    className="selectable"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
              </div>

              <button type="submit" className="btn auth-btn-primary" disabled={loading}>
                {loading ? 'Joining...' : "Let's Go! �"}
              </button>
            </form>

            <div className="auth-footer-links">
              <p>Already have an account? <Link to="/login">Log in here!</Link></p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default RegisterPage;
