import axios from 'axios';

// --- A new, super-safe URL setup! ---
// On your frontend Render service, the VITE_API_URL environment variable should be:
// https://realmmaid-backend.onrender.com
// Notice there is NO /api at the end! This will prevent the /api/api bug!
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const API = axios.create({
  // We add the /api part here, so all our calls are correct!
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

/**
 * --- FIX: Bringing back our reliable token-fetcher! ---
 * This function asks the server for a fresh token every time we need one!
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

export default API;
