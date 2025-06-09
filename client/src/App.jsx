// client/src/App.jsx

import React, { useEffect } from 'react'; // I added useEffect!
import { Routes, Route } from 'react-router-dom';
import { getCsrfToken } from './api/csrf'; // Importing our new helper! <3

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
  // --- NEW: This little hook runs once when the app starts! ---
  useEffect(() => {
    // We're calling our function to get the token right away!
    getCsrfToken();
  }, []); // The empty brackets mean it only runs one time!

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
