import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { getCsrfToken } from './api/csrf';

// 1. Ensure this import is present
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


function App() {
  useEffect(() => {
    getCsrfToken();
  }, []);

  return (
    // A React component must return a single parent element.
    // We use a React Fragment (<>...</>) to wrap Routes and Toaster.
    <>
      <Routes>
        {/* All your Route components go here... */}
        <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/please-verify" element={<PleaseVerifyPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
        </Route>
        <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* 2. Ensure this Toaster component is present */}
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
