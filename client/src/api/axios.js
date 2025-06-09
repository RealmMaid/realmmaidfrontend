import axios from 'axios';

// --- FIX: The base URL should now point directly to the /api endpoint. ---
// This simplifies all future API calls, as they won't need to include '/api'.
// On your frontend Render service, set the VITE_API_URL environment variable to:
// https://realmmaid-backend.onrender.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://realmmaid-backend.onrender.com/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This is crucial for sending session cookies across domains
});

/**
 * A simple, explicit function to get the CSRF token.
 * It makes one clean request to the backend to get the token.
 */
let csrfToken = null;

export const getCsrfToken = async () => {
  // Return the stored token if we already have it to avoid unnecessary requests
  if (csrfToken) {
    return csrfToken;
  }
  try {
    // --- FIX: The path no longer needs /api, as it's in the baseURL ---
    const { data } = await API.get('/auth/csrf-token');
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
