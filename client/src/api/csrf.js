// client/src/api/csrf.js

import axios from './axios'; // We're using your special axios instance! uwu

/**
 * Fetches the CSRF token from the server and configures the main axios instance
 * to include it in the headers of all subsequent requests. So magical! ✨
 */
export const getCsrfToken = async () => {
  try {
    // Let's go ask the server for the token!
    const response = await axios.get('/api/auth/csrf-token');
    const csrfToken = response.data.csrfToken;

    // Now we tell axios to put this token in its little backpack (headers) for every trip (request) it makes!
    axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;

    console.log('CSRF token is all set and ready to go! (｡^ U ^｡)');
  } catch (error) {
    console.error('O-oh no! Could not get the CSRF token... (╯︵╰,)', error);
  }
};
