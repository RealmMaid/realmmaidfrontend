import React, { useState, useEffect } from 'react';

// Some super useful numbers to keep things tidy!
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const PLAYER_SPEED = 8; // You can make this faster or slower! owo

function SpaceDodgerGame() {
    // This state remembers our player's left/right position!
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);
    
    // This state remembers which keys are being pressed down rn.
    const [keysPressed, setKeysPressed] = useState({});

    // This is our Game Loop! It runs over and over to make things move~
    useEffect(() => {
        const gameTick = setInterval(() => {
            // Check which keys are pressed and move the player!
            if (keysPressed['a'] || keysPressed['ArrowLeft']) {
                setPlayerX(prevX => Math.max(0, prevX - PLAYER_SPEED));
            }
            if (keysPressed['d'] || keysPressed['ArrowRight']) {
                setPlayerX(prevX => Math.min(GAME_WIDTH - PLAYER_WIDTH, prevX + PLAYER_SPEED));
            }
        }, 16); // This runs about 60 times a second, for suuuper smooth movement!

        // Cleanup when we're done, teehee~
        return () => clearInterval(gameTick);
    }, [keysPressed]); // This effect re-runs if the keys being pressed change!

    // This effect listens for when you press a key down!
    useEffect(() => {
        const handleKeyDown = (e) => {
            setKeysPressed(prev => ({ ...prev, [e.key]: true }));
        };
        
        const handleKeyUp = (e) => {
            setKeysPressed(prev => ({ ...prev, [e.key]: false }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []); // The empty array means this only runs once!

    // This is what our game looks like! The style stuff is super important!
    const gameAreaStyle = {
        width: `${GAME_WIDTH}px`,
        height: `${GAME_HEIGHT}px`,
        backgroundColor: '#000000',
        border: '2px solid hotpink',
        borderRadius: '10px',
        position: 'relative', // This is important for positioning things inside!
        overflow: 'hidden', // So our player can't escape the box! >:3
        margin: 'auto', // To center the game area on the page
    };

    const playerStyle = {
        width: `${PLAYER_WIDTH}px`,
        height: `${PLAYER_HEIGHT}px`,
        backgroundColor: 'cyan',
        borderRadius: '5px',
        position: 'absolute',
        bottom: '20px', // A little space at the bottom
        transform: `translateX(${playerX}px)`, // This moves our player left and right!
    };

    return (
        <div style={{ fontFamily: 'monospace', color: 'white', textAlign: 'center' }}>
            <h2>Space Dodger! uwu</h2>
            <div style={gameAreaStyle}>
                <div style={playerStyle}></div>
            </div>
        </div>
    );
}

export default SpaceDodgerGame;
