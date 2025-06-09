// client/src/api/axios.js
import axios from 'axios';

// The base URL now includes /api, pointing directly to our backend's API root.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This is super important for sending session cookies!
});

export default API;
