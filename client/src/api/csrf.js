// client/src/api/csrf.js
import API from './axios';

// This will hold our special promise, so we only fetch the token once!
let csrfTokenPromise = null;

/**
 * Returns a promise that resolves with the CSRF token.
 * It ensures the token is only fetched from the server a single time.
 */
export const getCsrfToken = () => {
    if (!csrfTokenPromise) {
        // If we don't have a promise yet, create one!
        csrfTokenPromise = API.get('/auth/csrf-token')
            .then(response => {
                // --- FIX: Added robust logging to verify the backend response ---
                console.log('Full response from /auth/csrf-token:', response.data);

                const token = response.data.csrfToken;

                if (!token) {
                    console.error("Could not find 'csrfToken' key in the response data!", response.data);
                } else {
                    console.log('CSRF token fetched successfully! (｡^ U ^｡)');
                }
                
                // The promise will resolve with the token value
                return token;
            })
            .catch(error => {
                console.error('O-oh no! Could not get the CSRF token... (╯︵╰,)', error);
                // If it fails, we reset the promise so the app can try again on the next request.
                csrfTokenPromise = null; 
                return Promise.reject(error);
            });
    }
    // Always return the promise, whether it's new or existing.
    return csrfTokenPromise;
};
