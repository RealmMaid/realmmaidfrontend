import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'white' }}>
      <h1>404 - Page Not Found</h1>
      <p>Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" style={{ color: '#ff3366', textDecoration: 'underline' }}>
        Go back to the Home Page
      </Link>
    </div>
  );
}

export default NotFoundPage;
