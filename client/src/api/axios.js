// client/src/api/axios.js

import axios from 'axios';
import { getCsrfToken } from './csrf'; // We still need our patient promise function

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// This is our final, super-smart interceptor!
API.interceptors.request.use(
    async (config) => {
        // === THIS IS THE FIX! ===
        // If the request is to get the CSRF token itself, don't intercept it!
        // Just let it go on its way immediately. This breaks the infinite loop.
        if (config.url === '/auth/csrf-token') {
            return config;
        }

        // For every OTHER request, we'll pause and add the token.
        try {
            const token = await getCsrfToken();
            if (token) {
                config.headers['X-CSRF-Token'] = token;
            }
        } catch (error) {
            console.error("CSRF token could not be attached. The request might fail.", error);
        }
    
        return config;
    }, 
    (error) => {
        return Promise.reject(error);
    }
);

export default API;
