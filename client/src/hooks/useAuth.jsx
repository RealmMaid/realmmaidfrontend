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
                    console.error("AuthProvider: The API call to /api/auth/session failed.", error);
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
            // We always get a fresh token now! No clearing needed UwU
            const token = await getCsrfToken();
            if (!token) {
                throw new Error('Could not get the super secret security token, sowwy!');
            }

            // Let's try sending the header name in all lowercase, just to be safe!
            const { data } = await API.post('/auth/login', 
                { email, password, _csrf: token },
                { headers: { 'x-csrf-token': token } } 
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
            throw error.response?.data || new Error('An unknown error occurred.');
        }
    };

    const logout = async () => {
        try {
            const token = await getCsrfToken();
            if (token) {
                 // Let's use the lowercase header name here too!
                await API.post('/auth/logout', 
                    { _csrf: token },
                    { headers: { 'x-csrf-token': token } }
                );
            }
        } catch (error) {
            console.error('Logout failed ;w;', error);
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
