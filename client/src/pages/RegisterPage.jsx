import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// --- Real Dependencies ---
// Import the central API instance and the CSRF token helper.
import API, { getCsrfToken } from '../api/axios.js';

/**
 * --- STYLES FOR THE REGISTER PAGE ---
 * A component to hold all the CSS from your legacy auth.css file.
 * This makes the RegisterPage self-contained and styled correctly.
 */
const RegisterStyles = () => (
    <style>{`
        /* Using the same layout and button styles as the login page for consistency */
        .auth-page { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: flex-start;
            min-height: 100vh; 
            padding: 1rem;
            padding-top: 8vh; /* UPDATED: Brought the main box up a bit */
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
        .auth-btn-primary { display: block; width: 100%; margin-top: 1.5rem; font-family: var(--font-pixel); font-size: 1rem; border-radius: 20px; color: var(--text-dark); padding: 14px 20px; }
        .auth-footer-links { margin-top: 1.5rem; font-size: 0.9em; }
        .auth-footer-links p { color: var(--text-secondary); }
        .auth-footer-links a { color: var(--accent-pink); font-weight: 600; }
        .btn-back-home { 
            position: absolute; 
            top: 4rem; /* UPDATED: Moved the button down a bit */
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
        .btn-back-home:hover { background-color: rgba(var(--accent-lavender-rgb), 0.1); color: var(--accent-pink); transform: translateY(-2px); box-shadow: var(--shadow-lg); }
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
 * The fully functional and styled Registration Page component.
 */
function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);
        try {
            const token = await getCsrfToken();
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                _csrf: token,
            };
            
            const response = await API.post('/auth/register', payload);

            if (response.data.success) {
                navigate(`/please-verify?email=${encodeURIComponent(response.data.email)}`);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'An unexpected error occurred during registration.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page register-page">
            <RegisterStyles />
            <StarryBackground />
            <Link to="/" className="btn-back-home">« Back to the Fun Zone!</Link>

            <div className="auth-container">
                <main className="auth-main">
                    <div className="auth-card card">
                        <div className="card-header">
                            <h2><span>Join the Sparkle Party! ✨</span></h2>
                            <p>Let's get you signed up, superstar! <br />It'll be super quick, promise! UwU</p>
                        </div>

                        {error && <div className="message-area error" style={{display: 'block'}}>{error}</div>}

                        <form id="registrationForm" onSubmit={handleRegister}>
                            <div className="form-group"><label htmlFor="firstName">Your Awesome First Name! ✨</label><input type="text" id="firstName" name="firstName" required placeholder="e.g., Sparkle" className="selectable" autoComplete="given-name" value={formData.firstName} onChange={handleChange} disabled={loading} /></div>
                            <div className="form-group"><label htmlFor="lastName">Your Super Last Name! 💖</label><input type="text" id="lastName" name="lastName" required placeholder="e.g., Unicorn" className="selectable" autoComplete="family-name" value={formData.lastName} onChange={handleChange} disabled={loading} /></div>
                            <div className="form-group"><label htmlFor="email">Your Cutie Email Address~ UwU</label><input type="email" id="email" name="email" required placeholder="e.g., glitterbomb@example.com" className="selectable" autoComplete="email" value={formData.email} onChange={handleChange} disabled={loading} /></div>
                            
                            <div className="form-group">
                                <label htmlFor="password">Choose a Super Secret Password! 🤫</label>
                                <div className="password-input-container">
                                    <input type={showPassword ? 'text' : 'password'} id="password" name="password" required minLength="8" placeholder="At least 8 characters, make it strong! 💪" className="selectable" autoComplete="new-password" value={formData.password} onChange={handleChange} disabled={loading} />
                                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Your Secret! *wink*</label>
                                <div className="password-input-container">
                                    <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" required placeholder="Make sure it matches! ;)" className="selectable" autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} disabled={loading} />
                                    <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></button>
                                </div>
                            </div>
                            <button type="submit" className="btn auth-btn-primary" disabled={loading}>
                                {loading ? 'Joining the Party...' : 'Join the Fun! 🚀'}
                            </button>
                        </form>

                        <div className="auth-footer-links">
                            <p>Already a Realm Cutie? <Link to="/login">Log In Here! ✨</Link></p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default RegisterPage;
