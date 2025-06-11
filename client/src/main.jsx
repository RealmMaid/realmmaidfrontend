import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './hooks/useAuth.jsx';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext.jsx';
import { WebSocketProvider } from './contexts/WebSocketProvider.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// This is the function that renders our entire React app.
const renderApp = () => {
  const queryClient = new QueryClient();

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <WebSocketProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </WebSocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  );
};

// --- THIS IS THE FIX! ---
// This code tells the browser: "Do NOT run the renderApp function
// until the entire HTML document has been completely loaded and is ready."
// This prevents any possibility of a race condition where React
// tries to attach to a DOM element that doesn't exist yet.
if (document.readyState === 'loading') {
  // The document is still loading, so we wait for the event.
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  // The document is already ready, so we can render immediately.
  renderApp();
}
