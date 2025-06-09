import axios from 'axios';

// --- AXIOS INSTANCE ---
// Creates a base instance of Axios for API calls.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

let csrfToken = null;

// --- CSRF TOKEN MANAGEMENT ---
// Fetches the CSRF token from the server.
export const getCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  try {
    const { data } = await API.get('/auth/csrf-token');
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
};

// Clears the locally stored CSRF token.
export const clearCsrfToken = () => {
  csrfToken = null;
};

// --- AXIOS INTERCEPTORS ---
// Request interceptor to automatically add the CSRF token to relevant requests.
API.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const token = await getCsrfToken();
    if (token) {
      config.headers['X-CSRF-Token'] = token;
    }
  }
  return config;
});

export default API;
