import axios from 'axios';
import Cookies from 'js-cookie';

// On your frontend Render service, the VITE_API_URL should be:
// https://realmmaid-backend.onrender.com
// Notice there is NO /api at the end!
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Super important for cookies!
});

// --- FIX: The magical interceptor! ---
// This little function runs before EVERY request you make with Axios.
// It automatically finds the 'XSRF-TOKEN' cookie and puts it in the
// 'X-XSRF-TOKEN' header, just like our server now expects!
API.interceptors.request.use((config) => {
    const token = Cookies.get('XSRF-TOKEN');
    if (token) {
        config.headers['X-XSRF-TOKEN'] = token;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// We don't need the getCsrfToken or clearCsrfToken functions anymore, teehee!
// The interceptor does all the work for us now!

export default API;
