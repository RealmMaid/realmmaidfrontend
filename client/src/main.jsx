import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
//import './index.css';
import { AuthProvider } from './hooks/useAuth.jsx';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext.jsx';
import { WebSocketProvider } from './contexts/WebSocketProvider.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// This is the cleaned up version with React.StrictMode removed as a last resort.

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
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
);
