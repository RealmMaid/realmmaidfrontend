import axios from 'axios';

// The base URL should point directly to your /api endpoint.
// On your frontend Render service, the VITE_API_URL environment variable should be:
// https://realmmaid-backend.onrender.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://realmmaid-backend.onrender.com/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Super important for cookies!
});

/**
 * --- FIX: Always fetch a new token! ---
 * This function now ALWAYS asks the server for a new token.
 * This makes sure we never, ever use a stale one by accident. It's safer!
 */
export const getCsrfToken = async () => {
  try {
    const { data } = await API.get('/auth/csrf-token');
    return data.csrfToken;
  } catch (error) {
    console.error("Oh noes! Couldn't fetch the CSRF token >.<", error);
    return null;
  }
};

// This function doesn't need to do anything anymore since we're not caching the token,
// but we'll keep it here just in case!
export const clearCsrfToken = () => {
    // It's a resting function now, teehee!
};

export default API;
