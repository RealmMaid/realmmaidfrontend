// client/src/api/axios.js
import axios from 'axios';
import { getCsrfToken } from './csrf'; // Import our new promise function

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// This is our super-smart interceptor!
API.interceptors.request.use(
    async (config) => {
        // We usually don't need CSRF for simple GET requests
        if (config.method === 'get') {
            return config;
        }

        try {
            // This line tells the request to PAUSE and wait for our promise to get the token!
            const token = await getCsrfToken();
            if (token) {
                // Once we have the token, we add it to the header!
                config.headers['X-CSRF-Token'] = token;
            }
        } catch (error) {
            console.error("CSRF token could not be attached. Aborting request.", error);
            // If we can't get a token, it's better to cancel the request than have it fail on the server.
            return Promise.reject(error);
        }
    
        return config;
    }, 
    (error) => {
        return Promise.reject(error);
    }
);

export default API;
