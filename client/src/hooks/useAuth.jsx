import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
                const { data } = await API.get('/auth/session', { signal });
                if (data.success && data.user) {
                    setUser(data.user);
                }
            } catch (error) {
                // An AbortError is expected on component unmount, so we don't log it.
                if (error.name !== 'AbortError') {
                    console.error("AuthProvider: The API call to /api/auth/session failed.", error);
                }
            } finally {
                // This block will run regardless of success or failure.
                // We only set loading to false if the component is still mounted.
                if (!signal.aborted) {
                    setAuthLoading(false);
                }
            }
        };
        
        checkSession();

        // The cleanup function will run if the component unmounts before the API call finishes.
        return () => {
            controller.abort();
        };
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await API.post('/auth/login', { email, password });
            if (data.success && data.user) {
                setUser(data.user);
                if (data.user.isAdmin) navigate('/admin');
                else navigate('/dashboard');
            }
            return data;
        } catch (error) {
            setUser(null);
            throw error.response?.data || new Error('An unknown error occurred.');
        }
    };

    const logout = async () => {
        try {
            await API.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            setUser(null);
            navigate('/');
        }
    };
    
    const register = async (email, password) => {
        try {
            const { data } = await API.post('/auth/register', { email, password });
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
        register,
        isAuthLoading,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* This ensures the rest of the app doesn't render until the initial session check is complete */}
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
