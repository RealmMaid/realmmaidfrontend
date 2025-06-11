import React, { useState, useEffect } from 'react';

// Constants for our game world
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 60;
const PLAYER_SPEED = 8;
const BOSS_WIDTH = 120;
const BOSS_HEIGHT = 80;
const BOSS_SPEED = 5;

function SpaceDodgerGame() {
    // Player state, starting in the middle.
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);

    // ✨ REVERTED: Going back to the original, simple states for the boss ✨
    const [bossX, setBossX] = useState((GAME_WIDTH - BOSS_WIDTH) / 2);
    const [bossDirection, setBossDirection] = useState('right');

    // State to track which keys are currently being held down.
    const [keysPressed, setKeysPressed] = useState({});

    // ✨ REVERTED: Using the original game loop logic from our first working version! ✨
    useEffect(() => {
        const gameTick = setInterval(() => {
            // --- Player Movement Logic ---
            setPlayerX(prevX => {
                let newX = prevX;
                if (keysPressed['a'] || keysPressed['ArrowLeft']) {
                    newX = prevX - PLAYER_SPEED;
                }
                if (keysPressed['d'] || keysPressed['ArrowRight']) {
                    newX = prevX + PLAYER_SPEED;
                }
                // Clamp the player's position!
                return Math.max(0, Math.min(newX, GAME_WIDTH - PLAYER_WIDTH));
            });

            // --- Original Boss Movement Logic ---
            let newBossX = bossX;
            if (bossDirection === 'right') {
                newBossX += BOSS_SPEED;
                if (newBossX > GAME_WIDTH - BOSS_WIDTH) {
                    newBossX = GAME_WIDTH - BOSS_WIDTH;
                    setBossDirection('left');
                }
            } else {
                newBossX -= BOSS_SPEED;
                if (newBossX < 0) {
                    newBossX = 0;
                    setBossDirection('right');
                }
            }
            setBossX(newBossX);

        }, 16);

        return () => clearInterval(gameTick);
    // The dependency array from the original version that watches everything.
    }, [keysPressed, bossX, bossDirection]);

    // Keyboard event listeners (this part has always been good!)
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
    }, []);

    // Style for the tiled background!
    const gameAreaStyle = {
        width: `${GAME_WIDTH}px`,
        height: `${GAME_HEIGHT}px`,
        backgroundImage: 'url(/space-tile.png)', // <-- ❗ Remember to use your tile's filename!
        backgroundRepeat: 'repeat',
        border: '2px solid hotpink',
        borderRadius: '10px',
        position: 'relative',
        overflow: 'hidden',
        margin: 'auto',
    };
    
    const bossStyle = {
        width: `${BOSS_WIDTH}px`,
        height: `${BOSS_HEIGHT}px`,
        position: 'absolute',
        top: '30px',
        transform: `translateX(${bossX}px)`,
    };
    
    const playerStyle = {
        width: `${PLAYER_WIDTH}px`,
        height: `${PLAYER_HEIGHT}px`,
        position: 'absolute',
        bottom: '20px',
        transform: `translateX(${playerX}px)`,
    };

    return (
        <div style={{ fontFamily: 'monospace', color: 'white', textAlign: 'center' }}>
            <h2>Space Dodger! uwu</h2>
            <div style={gameAreaStyle}>
                <img 
                    src="/oryx.png"
                    alt="Oryx the Mad God" 
                    style={bossStyle} 
                />
                <img 
                    src="/wizard.png"
                    alt="Hero" 
                    style={playerStyle} 
                />
            </div>
        </div>
    );
}

export default SpaceDodgerGame;
