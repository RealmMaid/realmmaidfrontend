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
                // Pass the signal to the API call
                const { data } = await API.get('/auth/session', { signal });
                if (data.success && data.user) {
                    setUser(data.user);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("AuthProvider: The API call to /api/auth/session failed.", error);
                } else {
                    console.log("AuthProvider: The session check timed out, likely because the service was spinning up. This is normal on free tiers.");
                }
            } finally {
                // Always set loading to false so the app can render
                setAuthLoading(false);
            }
        };
        
        // --- FIX: Increased timeout to 15 seconds ---
        // This gives Render's free tier services enough time to "wake up" from a sleep state.
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

        checkSession();

        // Cleanup function to run when the component unmounts
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, []);

    const login = async (email, password) => {
        try {
            const token = await getCsrfToken();
            const { data } = await API.post('/auth/login', {
                email,
                password,
                _csrf: token
            });

            if (data.success && data.user) {
                setUser(data.user);
                clearCsrfToken(); 
                if (data.user.isAdmin) {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            }
            return data;
        } catch (error) {
            setUser(null);
            throw error.response?.data || new Error('An unknown error occurred.');
        }
    };

    const logout = async () => {
        try {
            const token = await getCsrfToken();
            await API.post('/auth/logout', { _csrf: token });
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            // Always log the user out on the frontend
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
