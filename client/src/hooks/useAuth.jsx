import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// --- FIX: I've corrected the import path! ---
import API from '../api/axios.js';
// We don't need getCsrfToken here anymore because App.jsx handles it for the whole app!

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
            // --- FIX: No need to get the token here! ---
            // Our API instance now automatically includes the token in its headers.
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
            // --- FIX: The token is sent automatically! ---
            await API.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed ;w;', error);
        } finally {
            setUser(null);
            navigate('/');
        }
    };
    
    const register = async (email, password) => {
        try {
            // --- FIX: So much cleaner now! ---
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
