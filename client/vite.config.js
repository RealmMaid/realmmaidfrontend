import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1600, }
  // --- PRODUCTION-READY SETUP ---
  // This proxy configuration will forward any requests from your React app
  // that start with '/api' to your backend server running on port 3000.
  // This is only for development and makes it so you don't need to type
  // 'http://localhost:3000' in your client-side code.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true, // Recommended for virtual-hosted sites
        secure: false,      // Can be false for http target
      },
    },
  },
});
