// client/src/api/axios.js

import axios from 'axios';

// Get the backend URL from our environment variables!
// This makes it work perfectly in both development and production on Render!
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This is super important for sending session cookies!
});

// I removed the old interceptor! Our new getCsrfToken function that we
// call in App.jsx handles this much better and won't cause any more fights.
// Now, the token is fetched once and attached correctly with the 'X-CSRF-Token' header!

export default API;
