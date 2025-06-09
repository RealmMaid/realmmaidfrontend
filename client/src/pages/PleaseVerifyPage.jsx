import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
// --- FIX: We only need to import our magical API instance now! ---
import API from '../api/axios'; 

// --- STYLES COMPONENT (with the fix for the button) ---
const LoginStyles = () => (
    <style>{`
        .auth-page { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh; padding: 1rem; padding-top: 10vh; }
        .auth-container { width: 100%; display: flex; justify-content: center; align-items: center; }
        .auth-main { width: 100%; max-width: 500px; }
        .auth-card { background-color: var(--card-bg); border: 1px solid var(--card-border); border-radius: 20px; padding: 2rem 2.5rem; width: 100%; box-shadow: var(--shadow-lg), 0 0 20px rgba(var(--highlight-rgb), 0.15); text-align: center; position: relative; z-index: 1; animation: fadeInCard 0.5s ease-out; }
        @keyframes fadeInCard { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .auth-card .card-header { margin-bottom: 1.5rem; }
        .auth-card .card-header h2 { font-family: var(--font-pixel); color: var(--text-primary); text-shadow: 0 0 8px var(--accent-lavender); margin-bottom: 0.25rem; font-size: 1.6rem; }
        .auth-card .card-header h2::before, .auth-card .card-header h2::after { content: '＊'; color: var(--accent-pink); font-size: 0.9rem; margin: 0 0.5rem; opacity: 0.7; }
        .auth-card .card-header p { font-size: 1.05rem; margin-top: 1rem; margin-bottom: 1rem; color: var(--text-secondary); line-height: 1.6; }
        .auth-btn-primary { display: block; width: 100%; margin-top: 1.5rem; font-family: var(--font-pixel); font-size: 1rem; border-radius: 20px; color: var(--text-dark); padding: 14px 20px; }
        .auth-footer-links { margin-top: 2rem; font-size: 0.9em; }
        .auth-footer-links p { color: var(--text-secondary); }
        .auth-footer-links a { color: var(--accent-pink); font-weight: 600; }
        .cooldown-text { color: var(--text-secondary); margin-top: 1rem; font-size: 0.9rem; }
        .btn-back-home { position: absolute; top: 6.5rem; left: 1.5rem; background-color: var(--card-bg); border: 1px solid var(--card-border); color: var(--accent-lavender); border-radius: 12px; font-size: 0.9rem; padding: 10px 16px; text-decoration: none; z-index: 10; transition: all 0.2s ease-in-out; box-shadow: var(--shadow-md); }
        .btn-back-home:hover { background-color: rgba(var(--accent-lavender-rgb), 0.1); color: var(--accent-pink); transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        #stars-container-colorful { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; overflow: hidden; background: #1a0922; }
        .star { position: absolute; width: 2px; height: 2px; border-radius: 50%; animation: authTwinkle 5s infinite ease-in-out alternate; }
        @keyframes authTwinkle { 0% { opacity: 0.2; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1.2); } }
        .message-area { display: block; width: 100%; padding: 1rem; margin: 1rem 0; border-radius: var(--radius-md); font-size: 0.95rem; text-align: center; border: 1px solid transparent; }
        .message-area.success { background-color: rgba(var(--accent-green-rgb), 0.1); border-color: var(--accent-green); color: var(--accent-green); }
        .message-area.error { background-color: rgba(var(--accent-red-rgb), 0.1); border-color: var(--accent-red); color: var(--accent-red); }
    `}</style>
);

// --- STARRY BACKGROUND COMPONENT ---
const StarryBackground = () => {
    const containerRef = useRef(null);
    useEffect(() => {
        if (!containerRef.current) return;
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

// --- MAIN PLEASE VERIFY PAGE COMPONENT ---
function PleaseVerifyPage() {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    
    const [cooldown, setCooldown] = useState(60); 
    const email = searchParams.get('email');

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResendEmail = async () => {
        if (cooldown > 0 || loading) return;

        setError('');
        setMessage('');
        setLoading(true);

        try {
            // --- FIX: The magical interceptor in axios.js handles the token for us! ---
            const response = await API.post('/auth/resend-verification-email', { email });
            setMessage(response.data.message);
            setCooldown(60);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong, sowwy! >.<');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page please-verify-page">
            <LoginStyles />
            <StarryBackground />
            <Link to="/" className="btn-back-home">« Back to the Fun Zone</Link>

            <div className="auth-container">
                <main className="auth-main">
                    <div className="auth-card card">
                        <div className="card-header">
                            <h2><span>Almost There, Cutie! 📬</span></h2>
                            <p>
                                Your Realm Maid account is ready! We've sent a magical verification link to <strong>{email || 'your email address'}</strong>.
                            </p>
                            <p>
                                Please click it to activate your account and unlock all the sparkles! ✨
                            </p>
                        </div>
                        
                        {error && <div className="message-area error">{error}</div>}
                        {message && <div className="message-area success">{message}</div>}

                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button onClick={handleResendEmail} disabled={cooldown > 0 || loading} className="btn auth-btn-primary">
                                {loading ? 'Sending...' : (cooldown > 0 ? `You can resend in ${cooldown}s` : 'Resend Verification Email')}
                            </button>

                            {cooldown > 0 && (
                                <p className="cooldown-text">
                                    Didn't get the email? Be sure to check your spam folder!
                                </p>
                            )}
                        </div>

                        <div className="auth-footer-links">
                            <p>Already verified? <Link to="/login">Head to the Login Page!</Link></p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default PleaseVerifyPage;
