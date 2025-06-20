import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getCsrfToken } from './api/csrf';
import { Toaster } from 'react-hot-toast';

// --- Page Imports ---
import MainLayout from './components/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import PleaseVerifyPage from './pages/PleaseVerifyPage.jsx';
import UserDashboardPage from './pages/UserDashboardPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';

// --- Dashboard Component Imports ---
import MyOrders from './components/dashboard/MyOrders.jsx';
import ProfileSettings from './components/dashboard/ProfileSettings.jsx';
import PaymentMethods from './components/dashboard/PaymentMethods.jsx';
import MyWishlist from './components/dashboard/MyWishlist.jsx';
import SpaceDodgerGame from './components/dashboard/SpaceDodgerGame.jsx';

// ✨ We now import the main GameContainer directly!
import { GameContainer } from './components/dashboard/clicker/GameContainer';

function App() {
  useEffect(() => {
    getCsrfToken();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        <Route element={<MainLayout />}>
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/please-verify" element={<PleaseVerifyPage />} />
        </Route>
        
        {/* ✨ NEW: The game now has its own top-level, unprotected route for easy testing! */}
        <Route path="/game" element={<GameContainer />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<UserDashboardPage />}>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="settings"element={<ProfileSettings />} />
            <Route path="payments" element={<PaymentMethods />} />
            <Route path="wishlist" element={<MyWishlist />} />
            
            {/* The old route can be removed or kept, but /game is now our main testing ground */}
            <Route path="game" element={<GameContainer />} />

          </Route>
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>

        <Route element={<ProtectedRoute adminOnly={true} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        <Route path="/spacedodger" element={<SpaceDodgerGame />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#320d42',
            color: '#ffffff',
            border: '1px solid #4a1566'
          },
        }}
      />
    </>
  );
}

export default App;
