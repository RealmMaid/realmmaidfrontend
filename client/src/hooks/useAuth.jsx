import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// --- FIX: Import the simplified API instance and token functions ---
import API, { getCsrfToken, clearCsrfToken } from '../api/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setAuthLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // This effect runs once on app load to check if a user session exists
        const controller = new AbortController();
        const signal = controller.signal;

        const checkSession = async () => {
            try {
                const { data } = await API.get('/api/auth/session', { signal });
                if (data.success && data.user) {
                    setUser(data.user);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("AuthProvider: The API call to /api/auth/session failed.", error);
                }
            } finally {
                setAuthLoading(false);
            }
        };
        
        // Timeout to handle cases where the backend service is slow to start on Render
        const timeoutId = setTimeout(() => {
            if (isAuthLoading) {
                 console.log("AuthProvider: The session check timed out, likely because the service was spinning up. This is normal on free tiers.");
                 controller.abort();
            }
        }, 15000); // 15-second timeout

        checkSession();

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, []); // Empty dependency array ensures this runs only once

    const login = async (email, password) => {
        try {
            // --- FIX: Explicitly get the CSRF token before logging in ---
            const token = await getCsrfToken();
            if (!token) {
                throw new Error('Could not retrieve security token. Please refresh and try again.');
            }

            // --- FIX: Send the token in the 'X-CSRF-Token' header, which lusca expects by default. ---
            const { data } = await API.post('/api/auth/login', 
                { email, password }, // Request body
                { headers: { 'X-CSRF-Token': token } } // Request config with headers
            );

            if (data.success && data.user) {
                setUser(data.user);
                // No need to clear the token here, it remains valid for the session
                if (data.user.isAdmin) {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            }
            return data;
        } catch (error) {
            setUser(null);
            clearCsrfToken(); // Clear the potentially invalid token on a failed login
            throw error.response?.data || new Error('An unknown error occurred.');
        }
    };

    const logout = async () => {
        try {
            // --- FIX: Get the token and add it to the logout request header ---
            const token = await getCsrfToken();
            if (token) {
                await API.post('/api/auth/logout', 
                    {}, // Logout doesn't need a request body
                    { headers: { 'X-CSRF-Token': token } }
                );
            }
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            // Always log the user out on the frontend regardless of backend success
            setUser(null);
            clearCsrfToken();
            navigate('/');
        }
    };

    const value = {
        user,
        setUser,
        login,
        logout,
        isAuthLoading,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Don't render children until the initial auth check is complete */}
            {!isAuthLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
