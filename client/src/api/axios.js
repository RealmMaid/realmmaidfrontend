import axios from 'axios';

// --- FIX: Use an environment variable for the backend URL ---
// This makes the app configurable for any environment without code changes.
// For local development, create a .env file in your `client` directory
// and add the line: VITE_API_URL=http://localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://realmmaid-backend.onrender.com';

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This is crucial for sending session cookies across domains
});

/**
 * --- FIX: A simple, explicit function to get the CSRF token. ---
 * This is more reliable and less error-prone than using an interceptor for this purpose.
 * It makes one clean request to the backend to get the token.
 */
let csrfToken = null;

export const getCsrfToken = async () => {
  // Return the stored token if we already have it to avoid unnecessary requests
  if (csrfToken) {
    return csrfToken;
  }
  try {
    const { data } = await API.get('/api/auth/csrf-token');
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error("Could not fetch CSRF token", error);
    return null;
  }
};

// Function to clear the token, e.g., on logout or after a major error
export const clearCsrfToken = () => {
    csrfToken = null;
};

export default API;
