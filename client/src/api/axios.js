import axios from 'axios';

// --- PRODUCTION-READY SETUP ---
// By setting the baseURL to '/api', we can now make requests like `API.get('/auth/session')`.
// In development, the Vite proxy (in vite.config.js) will catch this and forward it
// to 'http://localhost:3000/api/auth/session'.
// In production, your server will be serving both the client and the API from the
// same domain, so requests to '/api/...' will work seamlessly.
const API = axios.create({
  baseURL: '/api',
  withCredentials: true, // This is important for sending session cookies
});

// Axios interceptor to add the CSRF token to all non-GET requests
API.interceptors.request.use(async (config) => {
  if (config.method !== 'get') {
    // Fetch the CSRF token if we don't have it or it's for a different request type
    const tokenResponse = await axios.get('/api/auth/csrf-token', { withCredentials: true });
    if (tokenResponse.data.csrfToken) {
      config.headers['csrf-token'] = tokenResponse.data.csrfToken;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});


export default API;
