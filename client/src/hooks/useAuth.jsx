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
            // --- FIX: Force a fresh token fetch to prevent using a stale one. ---
            // This clears any cached token before requesting a new one, ensuring
            // we always use the most up-to-date token for the current session.
            clearCsrfToken(); 
            const token = await getCsrfToken();
            if (!token) {
                throw new Error('Could not retrieve security token. Please refresh and try again.');
            }

            const { data } = await API.post('/auth/login', 
                { email, password, _csrf: token },
                { headers: { 'X-CSRF-Token': token } }
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
            // --- FIX: Also force a fresh token for logout. ---
            clearCsrfToken();
            const token = await getCsrfToken();
            if (token) {
                await API.post('/auth/logout', 
                    { _csrf: token },
                    { headers: { 'X-CSRF-Token': token } }
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
