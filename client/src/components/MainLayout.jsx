import React from 'react';
import { Outlet } from 'react-router-dom';

// A simplified MainLayout for debugging purposes.
function MainLayout() {
  return (
    <div style={{ backgroundColor: '#1a0922', color: 'white', minHeight: '100vh', padding: '20px' }}>
      <h1>Main Layout Header</h1>
      <p>If you can see this text, your routing and layout are working correctly. The content for the specific page (e.g., HomePage) should appear below the line.</p>
      <hr style={{ borderColor: '#4a1566' }} />
      
      <main>
        {/* The Outlet is where child components like HomePage will be rendered */}
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
