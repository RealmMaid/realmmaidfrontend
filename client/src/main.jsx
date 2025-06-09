import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './hooks/useAuth.jsx';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext.jsx';
// --- NEW: Import the WebSocketProvider ---
import { WebSocketProvider } from './contexts/WebSocketProvider.jsx';

console.log("main.jsx: Attempting to render App within all providers...");

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* --- NEW: WebSocketProvider wraps the app to provide chat functionality --- */}
        <WebSocketProvider>
          <CartProvider>
              <App />
          </CartProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
