import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { getCsrfToken, clearCsrfToken } from '../api/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setAuthLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const checkSession = async () => {
            try {
                const { data } = await API.get('/auth/session', { signal });
                if (data.success && data.user) {
                    setUser(data.user);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("AuthProvider: The API call to /auth/session failed.", error);
                }
            } finally {
                setAuthLoading(false);
            }
        };
        
        const timeoutId = setTimeout(() => {
            if (isAuthLoading) {
                 console.log("AuthProvider: The session check timed out, likely because the service was spinning up. This is normal on free tiers.");
                 controller.abort();
            }
        }, 15000);

        checkSession();

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, []);

    const login = async (email, password) => {
        try {
            const token = await getCsrfToken();
            if (!token) {
                throw new Error('Could not retrieve security token. Please refresh and try again.');
            }

            // --- FIX: Send the CSRF token in BOTH the request body and headers. ---
            // This is a highly robust approach that handles different server-side
            // configurations for the `lusca` middleware without needing backend changes.
            const { data } = await API.post('/auth/login', 
                { email, password, _csrf: token }, // Request body now includes `_csrf`
                { headers: { 'X-CSRF-Token': token } } // Header remains for best practice
            );

            if (data.success && data.user) {
                setUser(data.user);
                if (data.user.isAdmin) {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            }
            return data;
        } catch (error) {
            setUser(null);
            clearCsrfToken();
            throw error.response?.data || new Error('An unknown error occurred.');
        }
    };

    const logout = async () => {
        try {
            const token = await getCsrfToken();
            if (token) {
                // --- FIX: Also send the token in the body for the logout request. ---
                await API.post('/auth/logout', 
                    { _csrf: token }, // Request body with `_csrf`
                    { headers: { 'X-CSRF-Token': token } } // Header remains
                );
            }
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
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
