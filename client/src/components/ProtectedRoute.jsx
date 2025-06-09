import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// --- FIX: Ensure we're importing from the correct, central hook ---
import { useAuth } from '../hooks/useAuth.jsx';

const ProtectedRoute = ({ adminOnly = false }) => {
    // --- FIX: Use the state names from our central hook for consistency ---
    const { isAuthenticated, user, isAuthLoading } = useAuth();

    // Show a loading state while we check the session
    if (isAuthLoading) {
        return <div style={{color: 'white', textAlign: 'center', paddingTop: '5rem'}}>Loading session...</div>;
    }

    // If the user is not authenticated, redirect to the login page.
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If this route is for admins only and the user is not an admin,
    // redirect them to their regular dashboard.
    if (adminOnly && !user.isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }
    
    // If all checks pass, render the child route content (e.g., the Dashboard page)
    return <Outlet />;
};

export default ProtectedRoute;
