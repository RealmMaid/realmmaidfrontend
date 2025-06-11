import React, { useState, useEffect, useRef } from 'react';

// Constants are the same!
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

function SpaceDodgerGame() {
    // ✨ NEW: We create a ref to get a direct handle on our canvas element! ✨
    const canvasRef = useRef(null);

    // This effect will run once to set up our drawing board.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return; // Make sure the canvas exists

        // The "context" is like our magic paintbrush! We use it to draw everything.
        const context = canvas.getContext('2d');

        // Let's clear the canvas and draw our black background.
        context.fillStyle = 'black';
        context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    }, []); // The empty [] means this runs only once when the component mounts!

    return (
        <div style={{ fontFamily: 'monospace', color: 'white', textAlign: 'center' }}>
            <h2>Space Dodger! uwu</h2>
            {/* ✨ NEW: Our game now lives inside this canvas tag! ✨ */}
            <canvas
                ref={canvasRef}
                width={GAME_WIDTH}
                height={GAME_HEIGHT}
                style={{ border: '2px solid hotpink', borderRadius: '10px' }}
            />
        </div>
    );
}

export default SpaceDodgerGame;
