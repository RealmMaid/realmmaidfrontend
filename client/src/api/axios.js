// client/src/api/axios.js

import axios from 'axios';
import { getCsrfToken } from './csrf'; // We still need our patient promise function

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// This is our new, simpler interceptor!
API.interceptors.request.use(
    async (config) => {
        // We are REMOVING the check for 'get' requests.
        // Now, we will try to add the token to EVERY request.
        try {
            const token = await getCsrfToken();
            if (token) {
                config.headers['X-CSRF-Token'] = token;
            }
        } catch (error) {
            console.error("CSRF token could not be attached. The request might fail.", error);
            // We will let the request proceed and let the server decide.
            // This can help debug if the issue is with token fetching vs. the request itself.
        }
    
        return config;
    }, 
    (error) => {
        return Promise.reject(error);
    }
);

export default API;
