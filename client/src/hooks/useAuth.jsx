import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// --- UPDATED: Importing the new clearCsrfToken function ---
import API, { getCsrfToken, clearCsrfToken } from '../api/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setAuthLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data } = await API.get('/auth/session');
                if (data.success && data.user) {
                    setUser(data.user);
                }
            } catch (error) {
                console.error("AuthProvider: The API call to /api/auth/session failed.", error);
            } finally {
                setAuthLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (email, password) => {
        try {
            console.log("Login function: Attempting to get CSRF token...");
            const token = await getCsrfToken();
            console.log("Login function: Got token. Sending it in the request body...");

            const { data } = await API.post('/auth/login', {
                email,
                password,
                _csrf: token
            });

            if (data.success && data.user) {
                setUser(data.user);
                // --- FIX: Clear the old token after a successful login ---
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
            setUser(null);
            // --- FIX: Clear the token after a successful logout ---
            clearCsrfToken();
            navigate('/');
        } catch (error) {
            console.error('Logout failed', error);
            // Even if the backend call fails, log the user out on the frontend
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