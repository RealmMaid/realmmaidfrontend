import React from 'react';
// 1. Import NavLink and Outlet from react-router-dom
import { NavLink, Outlet } from 'react-router-dom';

function UserDashboardPage() {
  return (
    <div className="user-dashboard-container">
      <aside className="dashboard-sidebar">
        <h2>Hi Cutie!</h2>
        <nav>
          {/* 2. Use NavLink instead of buttons. It automatically adds an 'active' class! */}
          <NavLink to="/dashboard/orders">My Orders 🛍️</NavLink>
          <NavLink to="/dashboard/settings">Profile & Settings 💖</NavLink>
          <NavLink to="/dashboard/payments">Payment Methods 💳</NavLink>
          <NavLink to="/dashboard/wishlist">My Wishlist ✨</NavLink>
          <NavLink to="/dashboard/game">Pixel Game! 💎</NavLink>
          <NavLink to="/">Back to Shopping!</NavLink>
        </nav>
      </aside>
      <main className="dashboard-content">
        {/* 3. The Outlet component renders the active nested route (e.g., MyOrders, ProfileSettings) */}
        <Outlet />
      </main>
    </div>
  );
}

export default UserDashboardPage;