import React, { useEffect } from 'react';

// This is a simplified version for debugging purposes.
export default function PixelClickerGame() {

    useEffect(() => {
        // If this component mounts correctly, we will see this message.
        console.log(
            '%cPixelClickerGame Component Mounted!', 
            'color: #ff00ff; font-size: 24px; font-weight: bold;'
        );
    }, []); // Empty dependency array means this runs only once on mount.

    return (
        <div style={{ padding: '2rem', border: '5px solid hotpink', color: 'white' }}>
            <h1>Pixel Clicker Game Component</h1>
            <p>
                If you can see this pink box, the component is rendering successfully.
            </p>
            <p>
                Please check the console for a bright pink "Mounted!" message.
            </p>
        </div>
    );
}
