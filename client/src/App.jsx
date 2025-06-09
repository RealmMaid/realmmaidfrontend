import React from 'react';
import { Routes, Route } from 'react-router-dom';

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


function App() {
  return (
    <Routes>
      {/* --- Public Layout & Routes --- */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/please-verify" element={<PleaseVerifyPage />} />
      </Route>

      {/* --- Protected User Routes --- */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<UserDashboardPage />} />
        {/* --- NEW: Add the route for the checkout page --- */}
        <Route path="/checkout" element={<CheckoutPage />} />
      </Route>

      {/* --- Protected Admin Routes --- */}
      <Route element={<ProtectedRoute adminOnly={true} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Route>
      
      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
