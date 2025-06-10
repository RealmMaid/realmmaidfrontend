import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Import the CSS

function Header() {
  const [isNavActive, setIsNavActive] = useState(false);

  // We'll add logic for isLoggedIn and cart count later
  const isLoggedIn = false; 
  const cartItemCount = 0;

  return (
    <header className="main-header">
      <Link to="/" className="logo">Realm Maid</Link>

      <button className="menu-toggle-btn" onClick={() => setIsNavActive(!isNavActive)}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav className={`main-nav ${isNavActive ? 'active' : ''}`}>
        <ul id="navLinksContainer">
          {/* We will add more nav links here later */}
        </ul>
        <div className="auth-buttons-container">
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn">Log In</Link>
              <Link to="/register" className="btn btn-outline">Sign Up</Link>
            </>
          )}
        </div>
        <div className="cart-icon-container">
            <button id="cart-icon" className="cart-icon-button">
                🛒
                {cartItemCount > 0 && (
                    <span id="cartItemCountBadge" style={{ display: 'inline' }}>
                        {cartItemCount}
                    </span>
                )}
            </button>
        </div>
      </nav>
    </header>
  );
}

export default Header;