import React, { useState, useEffect } from 'react';

const ShoppingCartStyles = () => (
    <style>{`
        .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(26, 9, 34, 0.7);
            backdrop-filter: blur(5px);
            z-index: 1050;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0s 0.3s;
        }
        .modal-backdrop.active {
            opacity: 1;
            visibility: visible;
            transition: opacity 0.3s ease;
        }
        .cart-modal {
            position: fixed;
            top: 0;
            right: 0;
            width: 400px;
            max-width: 90vw;
            height: 100%;
            background-color: #2d0a3d;
            border-left: 1px solid #4a1566;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
            display: flex;
            flex-direction: column;
            transform: translateX(100%);
            transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
            z-index: 1051;
        }
        .modal-backdrop.active .cart-modal {
            transform: translateX(0);
        }
        .cart-modal-header {
            padding: 1rem;
            background-color: #1a0922;
            border-bottom: 1px solid #4a1566;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .cart-modal-header h2 {
            margin-bottom: 0;
            font-family: 'Press Start 2P', monospace;
            background: linear-gradient(135deg, #ff3366, #00e6cc);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .cart-modal-close-btn {
            font-size: 1.6rem;
            color: #cccccc;
            background: none;
            border: none;
            cursor: pointer;
        }
        .cart-modal-body {
            flex-grow: 1;
            overflow-y: auto;
            padding: 1rem;
        }
        .cart-items-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .cart-item-card {
            display: flex;
            gap: 1rem;
            background-color: rgba(50, 13, 66, 0.4);
            border-radius: 8px;
            padding: 0.5rem;
            border: 1px solid #4a1566;
        }
        .cart-item-card img {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
        }
        .cart-item-details h4 {
            margin: 0 0 0.25rem 0;
            font-size: 1rem;
            font-family: 'Press Start 2P', monospace;
        }
        .cart-item-details p {
            margin: 0;
            font-size: 0.85rem;
        }
        .cart-modal-footer {
            padding: 1rem;
            background-color: #1a0922;
            border-top: 1px solid #4a1566;
        }
        .cart-summary {
            background-color: #1a0922;
            border-radius: 12px;
            padding: 1rem;
            border: 1px solid #4a1566;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.25rem;
        }
    `}</style>
);

const ShoppingCart = ({ isOpen, onClose }) => {
    const [cartItems, setCartItems] = useState([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        // This logic is based on your checkout.js file
        const storedCart = localStorage.getItem('realmMaidCartForCheckout');
        const items = storedCart ? JSON.parse(storedCart) : [];
        setCartItems(items);

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotal(subtotal);
    }, [isOpen]); // Rerender when the modal is opened

    const handleCheckout = () => {
        // Redirect to a dedicated checkout page
        window.location.href = '/checkout';
    };

    return (
        <>
            <ShoppingCartStyles />
            <div className={`modal-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose}>
                <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="cart-modal-header">
                        <h2 className="gradient-text">Your Bag of Holding 🛍️</h2>
                        <button className="cart-modal-close-btn" aria-label="Close cart" onClick={onClose}>
                            ×
                        </button>
                    </div>
                    <div className="cart-modal-body">
                        <div id="cartItemsListDiv" className="cart-items-list">
                            {cartItems.length > 0 ? (
                                cartItems.map(item => (
                                    <div key={item.id} className="cart-item-card">
                                        <img src={item.image || 'https://placehold.co/60x60/320d42/ffffff?text=Item'} alt={item.name} />
                                        <div className="cart-item-details">
                                            <h4>{item.name}</h4>
                                            <p>Qty: {item.quantity}</p>
                                            <p>${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>Your cart is empty, cutie!</p>
                            )}
                        </div>
                    </div>
                    <div className="cart-modal-footer">
                        <div className="cart-summary card card-glass">
                            <div className="summary-row total-row">
                                <span style={{fontWeight: 'bold'}}>Total</span>
                                <span style={{fontWeight: 'bold'}} id="cartTotal">${total.toFixed(2)}</span>
                            </div>
                            <button id="proceedToCheckoutBtn" className="btn btn-primary-action btn-block" onClick={handleCheckout} disabled={cartItems.length === 0}>
                                Let's Checkout, Hun! 💖
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ShoppingCart;
