import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// --- FIX: We need our magical API instance AND our token helper! ---
import API, { getCsrfToken } from '../api/axios.js';

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
            // --- FIX: We get a fresh token every time, just to be super safe! ---
            const token = await getCsrfToken();
            if (!token) throw new Error('Could not get security token!');

            const { data } = await API.post('/auth/login', { email, password, _csrf: token });

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
            const token = await getCsrfToken();
            if (token) await API.post('/auth/logout', { _csrf: token });
        } catch (error) {
            console.error('Logout failed ;w;', error);
        } finally {
            setUser(null);
            navigate('/');
        }
    };
    
    const register = async (email, password) => {
        try {
            const token = await getCsrfToken();
            if (!token) throw new Error('Could not get security token!');

            const { data } = await API.post('/auth/register', { email, password, _csrf: token });
            
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
