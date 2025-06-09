import axios from 'axios';

// --- A new, super-safe URL setup! ---
// This code is extra smart to prevent the /api/api bug forever!
let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Defensively remove any trailing slash or /api from the end of the URL
baseURL = baseURL.replace(/\/$/, "").replace(/\/api$/, "");

// Now we can safely add /api to the end!
const API_BASE_URL = `${baseURL}/api`;

console.log(`Hiii! The API is talking to: ${API_BASE_URL}`); // A little message to make sure it's right!

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Our reliable token-fetcher!
 * This asks the server for a fresh token when we need one!
 */
export const getCsrfToken = async () => {
  try {
    const { data } = await API.get('/auth/csrf-token');
    return data.csrfToken;
  } catch (error) {
    console.error("Oh noes! Couldn't fetch the CSRF token >.<", error);
    // Let's log the full error to see what's happening!
    console.error("Full Axios Error:", error.toJSON());
    return null;
  }
};

export default API;
