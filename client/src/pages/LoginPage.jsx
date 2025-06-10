import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// --- UPDATED: The `useAuth` hook provides the CSRF-protected `login` function. ---
import { useAuth } from '../hooks/useAuth';

/**
 * --- STYLES FOR THE LOGIN PAGE ---
 * A component to hold all the CSS from your legacy auth.css file.
 * This makes the LoginPage self-contained and styled correctly.
 */
const LoginStyles = () => (
    <style>{`
        .auth-page { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: flex-start;
            min-height: 100vh; 
            padding: 1rem;
            padding-top: 10vh;
        }
        .auth-container { width: 100%; display: flex; justify-content: center; align-items: center; }
        .auth-main { width: 100%; max-width: 450px; }
        .auth-card { background-color: var(--card-bg); border: 1px solid var(--card-border); border-radius: 20px; padding: 2rem 2.5rem; width: 100%; box-shadow: var(--shadow-lg), 0 0 20px rgba(var(--highlight-rgb), 0.15); text-align: center; position: relative; z-index: 1; animation: fadeInCard 0.5s ease-out; }
        @keyframes fadeInCard { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .auth-card .card-header { margin-bottom: 1.5rem; }
        .auth-card .card-header h2 { font-family: var(--font-pixel); color: var(--text-primary); text-shadow: 0 0 8px var(--accent-lavender); margin-bottom: 0.25rem; font-size: 1.6rem; }
        .auth-card .card-header h2::before, .auth-card .card-header h2::after { content: '＊'; color: var(--accent-pink); font-size: 0.9rem; margin: 0 0.5rem; opacity: 0.7; }
        .auth-card .card-header p { font-size: 1rem; margin-top: 0.5rem; margin-bottom: 1.5rem; color: var(--text-secondary); line-height: 1.5; }
        .auth-card form { text-align: left; }
        .form-group { width: 100%; margin-bottom: 1.5rem; }
        .form-group label { font-weight: 600; display: block; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.9rem; }
        .form-group input:focus { border-color: var(--accent-pink); box-shadow: 0 0 0 3px rgba(var(--accent-pink-rgb), 0.25); }
        .password-input-container { position: relative; display: flex; align-items: center; }
        .password-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; padding: 5px; color: var(--text-secondary); }
        .password-toggle svg { stroke: var(--accent-lavender); }
        .password-toggle:hover svg { stroke: var(--accent-pink); }
        .form-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 0.9em; }
        .checkbox-container { color: var(--text-secondary); display: flex; align-items: center; }
        .checkbox-container input[type='checkbox'] { accent-color: var(--accent-pink); margin-right: 6px; transform: scale(1.1); }
        .form-actions a { color: var(--accent-pink); }
        .auth-btn-primary { display: block; width: 100%; margin-top: 1.5rem; font-family: var(--font-pixel); font-size: 1rem; border-radius: 20px; color: var(--text-dark); padding: 14px 20px; }
        .auth-footer-links { margin-top: 1.5rem; font-size: 0.9em; }
        .auth-footer-links p { color: var(--text-secondary); }
        .auth-footer-links a { color: var(--accent-pink); font-weight: 600; }
        
        /* --- Styles for the back home button --- */
        .btn-back-home {
            position: absolute;
            top: 5rem; 
            left: 1.5rem;
            background-color: var(--card-bg); 
            border: 1px solid var(--card-border); 
            color: var(--accent-lavender);
            border-radius: 12px; 
            font-size: 0.9rem;
            padding: 10px 16px;
            text-decoration: none;
            z-index: 10;
            transition: all 0.2s ease-in-out;
            box-shadow: var(--shadow-md);
        }
        .btn-back-home:hover {
            background-color: rgba(var(--accent-lavender-rgb), 0.1);
            color: var(--accent-pink);
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }

        #stars-container-colorful { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; overflow: hidden; background: #1a0922; }
        .star { position: absolute; width: 2px; height: 2px; border-radius: 50%; animation: authTwinkle 5s infinite ease-in-out alternate; }
        @keyframes authTwinkle { 0% { opacity: 0.2; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1.2); } }
    `}</style>
);

/**
 * A component to create the starry background effect.
 */
const StarryBackground = () => {
    const containerRef = useRef(null);
    useEffect(() => {
        const colors = ['#FFD700', '#FF69B4', '#00E6CC', '#ADFF2F', '#EE82EE'];
        const createStar = () => {
            if (!containerRef.current) return;
            const star = document.createElement('div');
            star.className = 'star';
            star.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDuration = `${Math.random() * 3 + 2}s`;
            containerRef.current.appendChild(star);
            setTimeout(() => star.remove(), 5000);
        };
        const intervalId = setInterval(createStar, 250);
        return () => clearInterval(intervalId);
    }, []);
    return <div ref={containerRef} id="stars-container-colorful"></div>;
};


/**
 * The fully functional and styled Login Page component.
 */
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  // --- UPDATED: The `login` function is retrieved from the useAuth hook.
  // This function already contains the complete CSRF token handling logic.
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // --- ANNOTATION: Calling `login` here triggers the secure login flow ---
      // from `useAuth.jsx`. It will automatically:
      // 1. Call `getCsrfToken()` to fetch the token.
      // 2. Send the token in the POST request to `/api/auth/login`.
      // 3. Handle the response, including navigation.
      await login(email, password);
      // The useAuth hook handles navigation on successful login.
    } catch (err) {
      const message = err.message || 'An unexpected error occurred.';
      // --- ANNOTATION: This error handling is specific to the LoginPage. ---
      // If the error indicates an unverified email, we navigate to the verify page.
      // Other errors, including potential CSRF errors (403), are displayed directly.
      if (message.includes('verify your email')) {
          navigate(`/please-verify?email=${encodeURIComponent(email)}`);
      } else {
          setError(message);
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <LoginStyles />
      <StarryBackground />
      <Link to="/" className="btn-back-home">« Back to the Fun Zone!</Link>

      <div className="auth-container">
        <main className="auth-main">
          <div className="auth-card card">
            <div className="card-header">
              <h2><span>Log In, Cutie! ✨</span></h2>
              <p>Let's get you all signed in, sweetie!</p>
            </div>

            {error && <div className="message-area error" style={{display: 'block'}}>{error}</div>}

            <form id="loginForm" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Your Adorable Email~</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="e.g., cutiepie@example.com"
                  className="selectable"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Secret Password *giggles*</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    required
                    placeholder="Shhh, it's a secret! 🤫"
                    className="selectable"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button type="button" className="password-toggle" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /> <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <label className="checkbox-container">
                  <input type="checkbox" id="rememberMe" name="rememberMe" /> Remember this cutie?
                </label>
                <Link to="/forgot-password">Forgot your passy? Oopsie!</Link>
              </div>

              <button type="submit" className="btn auth-btn-primary" disabled={loading}>
                {loading ? 'Logging In...' : "Let's Go! 💖"}
              </button>
            </form>

            <div className="auth-footer-links">
              <p>New here, sweet thing? <Link to="/register">Join the Party! 🎉</Link></p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LoginPage;
