import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// --- FIX: We only need to import our magical API instance now! ---
import API from '../api/axios.js';

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
                // The interceptor in axios.js will automatically add the CSRF header!
                const { data } = await API.get('/auth/session', { signal });
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
        
        const timeoutId = setTimeout(() => {
            if (isAuthLoading) {
                 console.log("AuthProvider: The session check timed out.");
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
            // --- FIX: So simple now! ---
            // We don't need to get or send the token at all!
            // The Axios interceptor handles EVERYTHING automatically! So cute!
            const { data } = await API.post('/auth/login', { email, password });

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
            throw error.response?.data || new Error('An unknown error occurred.');
        }
    };

    const logout = async () => {
        try {
            // The interceptor adds the header here too! Effortless!
            await API.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed ;w;', error);
        } finally {
            setUser(null);
            navigate('/');
        }
    };
    
    // --- FIX: A new function for registration! ---
    // It works just like login, using the magical interceptor!
    const register = async (email, password) => {
        try {
            // The Axios interceptor will handle the CSRF token for us!
            const { data } = await API.post('/auth/register', { email, password });
            
            // After a successful registration, we can send the user to verify their email!
            if (data.success) {
                navigate(`/please-verify?email=${encodeURIComponent(email)}`);
            }
            return data;
        } catch (error) {
             throw error.response?.data || new Error('An unknown error occurred during registration.');
        }
    };

    const value = {
        user,
        setUser,
        login,
        logout,
        register, // We can now use this from any component!
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
