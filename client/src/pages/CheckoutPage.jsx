import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import API, { getCsrfToken } from '../api/axios';

// --- Reusable Starry Background from other auth pages ---
const StarryBackground = () => {
    const containerRef = useRef(null);
    useEffect(() => {
        if (!containerRef.current) return;
        const colors = ['#FFD700', '#FF69B4', '#00E6CC', '#ADFF2F', '#EE82EE'];
        const createStar = () => {
            if (!containerRef.current) return;
            const star = document.createElement('div');
            star.className = 'star';
            star.style.backgroundColor = colors[(Math.floor(Math.random() * colors.length) % colors.length)];
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

// --- Styles for the Checkout Page ---
const CheckoutStyles = () => (
    <style>{`
        /* Base page styles from auth pages */
        .auth-page { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh; padding: 2rem 1rem; padding-top: 10vh; }
        .auth-container { width: 100%; display: flex; justify-content: center; align-items: flex-start; }
        .auth-main { width: 100%; max-width: 800px; }
        .auth-card { background-color: var(--card-bg); border: 1px solid var(--card-border); border-radius: 20px; padding: 2rem 2.5rem; width: 100%; box-shadow: var(--shadow-lg), 0 0 20px rgba(var(--highlight-rgb), 0.15); text-align: left; animation: fadeInCard 0.5s ease-out; }
        .auth-card .card-header { text-align: center; margin-bottom: 2rem; }
        .auth-card .card-header h2 { font-family: var(--font-pixel); color: var(--text-primary); text-shadow: 0 0 8px var(--accent-lavender); margin-bottom: 0.25rem; font-size: 1.6rem; }
        .auth-card .card-header p { font-size: 1rem; margin-top: 0.5rem; color: var(--text-secondary); line-height: 1.5; }

        /* Checkout specific layout */
        .checkout-layout { display: grid; grid-template-columns: 1fr; gap: 2.5rem; margin-bottom: 2rem; }
        .checkout-section h3 { font-size: 1.2rem; font-family: var(--font-pixel); color: var(--accent-teal); margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 1px dashed var(--card-border); }
        .form-group { width: 100%; margin-bottom: 1.5rem; }
        .form-group label { font-weight: 600; display: block; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.9rem; }
        .form-group input { width: 100%; }
        .form-group input:focus { border-color: var(--accent-pink); box-shadow: 0 0 0 3px rgba(var(--accent-pink-rgb), 0.25); }
        .checkout-items-list { max-height: 300px; overflow-y: auto; padding-right: 0.5rem; margin-bottom: 1rem; }
        .checkout-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--card-border); font-size: 0.9rem; }
        .checkout-item:last-child { border-bottom: none; }
        .item-details { display: flex; align-items: center; gap: 1rem; }
        .item-details img { width: 40px; height: 40px; border-radius: var(--radius-sm); object-fit: cover; }
        .item-name { color: var(--text-primary); font-weight: 600; }
        .item-qty-price { color: var(--text-secondary); font-size: 0.85rem; }
        .summary-row { display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.95rem; }
        .summary-row.total-row { font-size: 1.2rem; font-weight: 600; margin-top: 0.5rem; }
        .summary-row .gradient-text { background: var(--gradient-primary); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

        .auth-btn-primary { width: 100%; margin-top: 1rem; }
        #stars-container-colorful { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; overflow: hidden; background: #1a0922; }
        .star { position: absolute; width: 2px; height: 2px; border-radius: 50%; animation: authTwinkle 5s infinite ease-in-out alternate; }
        @keyframes authTwinkle { 0% { opacity: 0.2; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1.2); } }
        .message-area { display: block; width: 100%; padding: 1rem; margin: 1.5rem 0; border-radius: var(--radius-md); font-size: 0.95rem; text-align: center; border: 1px solid transparent; }
        .message-area.error { background-color: rgba(var(--accent-red-rgb), 0.1); border-color: var(--accent-red); color: var(--accent-red); }
        .empty-cart-message { text-align: center; padding: 3rem 1rem; }
        /* --- UPDATED: Add margin to the Back to Shopping button --- */
        .empty-cart-message .auth-btn-primary {
            margin-top: 3rem; /* Adjust as needed for equal spacing */
        }

        @media (min-width: 768px) {
            .checkout-layout { grid-template-columns: 1.5fr 1fr; }
            .order-summary { position: sticky; top: 2rem; }
        }
    `}</style>
);


function CheckoutPage() {
    const { user } = useAuth();
    const { cartItems, cartItemCount } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [shippingDetails, setShippingDetails] = useState({
        firstName: '', lastName: '', email: '', addressLine1: '',
        addressLine2: '', city: '', postalCode: '', state: '', country: '',
    });

    // Pre-fill user info
    useEffect(() => {
        if (user) {
            setShippingDetails(prev => ({
                ...prev,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShippingDetails(prev => ({ ...prev, [name]: value }));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const csrfToken = await getCsrfToken();

            const orderData = {
                items: cartItems.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity, image: item.image })),
                shippingDetails,
                customerEmail: shippingDetails.email,
                _csrf: csrfToken
            };

            const response = await API.post('/checkout/create-checkout-session', orderData);

            const session = response.data;
            if (!session.id || !session.publishableKey) {
                throw new Error('Failed to create a valid payment session.');
            }

            const stripe = await loadStripe(session.publishableKey);
            const { error: stripeError } = await stripe.redirectToCheckout({
                sessionId: session.id,
            });

            if (stripeError) {
                throw new Error(stripeError.message);
            }

        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An unknown error occurred.');
            setLoading(false);
        }
    };

    return (
        <div className="auth-page checkout-page">
            <CheckoutStyles />
            <StarryBackground />
            <div className="auth-container">
                <main className="auth-main">
                    <div className="auth-card card">
                        <div className="card-header">
                            <h2><span>Final Step, Cutie! ✨</span></h2>
                            <p>{cartItemCount > 0 ? "Let's get these goodies to you! Just a few more deets! UwU" : "Your cart is empty, silly!"}</p>
                        </div>

                        {error && <div className="message-area error">{error}</div>}

                        {cartItemCount > 0 ? (
                            <form id="checkoutForm" onSubmit={handleCheckout}>
                                <div className="checkout-layout">
                                    <section className="checkout-section shipping-info">
                                        <h3>💖 Shipping Sparkles To:</h3>
                                        {Object.entries(shippingDetails).map(([key, value]) => (
                                            <div className="form-group" key={key}>
                                                <label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                                                <input
                                                    type={key === 'email' ? 'email' : 'text'}
                                                    id={key}
                                                    name={key}
                                                    required={key !== 'addressLine2'}
                                                    placeholder={`e.g., ${key}...`}
                                                    className="selectable"
                                                    value={value}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        ))}
                                    </section>

                                    <section className="checkout-section order-summary">
                                        <h3>🎁 Your Goodies:</h3>
                                        <div className="checkout-items-list">
                                            {cartItems.map(item => (
                                                <div key={item.id} className="checkout-item">
                                                    <div className="item-details">
                                                        <img src={item.image} alt={item.name} onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/40x40/320d42/ffffff?text=Item'; }}/>
                                                        <div>
                                                            <p className="item-name">{item.name}</p>
                                                            <p className="item-qty-price">Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <hr style={{borderColor: 'var(--card-border)', margin: '1rem 0'}}/>
                                        <div className="summary-row">
                                            <span>Subtotal:</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="summary-row total-row">
                                            <span>Grand Total Sparkles:</span>
                                            <span className="gradient-text">${subtotal.toFixed(2)}</span>
                                        </div>
                                        <button type="submit" id="placeOrderBtn" className="btn auth-btn-primary" disabled={loading}>
                                            {loading ? 'Processing...' : 'Proceed to Secure Sparkle Payment 🚀'}
                                        </button>
                                    </section>
                                </div>
                            </form>
                        ) : (
                            <div className="empty-cart-message">
                                <h3>Oopsie!</h3>
                                <p style={{ marginBottom: '3rem' }}>There's nothing here to check out with. Go on, add some sparkles to your cart!</p>
                                <Link to="/" className="btn auth-btn-primary">Back to Shopping</Link>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default CheckoutPage;