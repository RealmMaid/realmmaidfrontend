// client/src/api/csrf.js
import API from './axios'; // We now import our special, pre-configured API instance!

/**
 * Fetches the CSRF token from the server and configures our API instance
 * to include it in the headers of all subsequent requests.
 */
export const getCsrfToken = async () => {
  try {
    // We now call .get() on our API instance, and the path is relative to its baseURL.
    // This will correctly call '.../api/auth/csrf-token'.
    const response = await API.get('/auth/csrf-token');
    const csrfToken = response.data.csrfToken;

    // Set the token on the default headers for our single, special API instance.
    API.defaults.headers.common['X-CSRF-Token'] = csrfToken;

    console.log('CSRF token fetched and set successfully! (｡^ U ^｡)');
  } catch (error) {
    console.error('O-oh no! Could not get the CSRF token... (╯︵╰,)', error);
  }
};
