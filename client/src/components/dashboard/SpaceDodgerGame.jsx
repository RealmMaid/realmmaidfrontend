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

// ✨ FRESH START: A completely rewritten and re-checked component! ✨
function SpaceDodgerGame() {
    // State for the player's horizontal position, starting in the middle.
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);

    // State for the boss, now in a single object for stability.
    // Let's start the boss in the middle too! Hehe.
    const [bossState, setBossState] = useState({
        x: (GAME_WIDTH - BOSS_WIDTH) / 2,
        direction: 'right',
    });
    
    // State to track which keys are currently being held down.
    const [keysPressed, setKeysPressed] = useState({});

    // The main game loop, rewritten to be extra careful!
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
                // Clamp the new position to stay within the boundaries!
                return Math.max(0, Math.min(newX, GAME_WIDTH - PLAYER_WIDTH));
            });

            // --- Boss Movement Logic ---
            setBossState(prev => {
                let nextX = prev.x;
                let nextDirection = prev.direction;

                if (prev.direction === 'right') {
                    nextX = prev.x + BOSS_SPEED;
                    // Check right boundary
                    if (nextX > GAME_WIDTH - BOSS_WIDTH) {
                        nextX = GAME_WIDTH - BOSS_WIDTH;
                        nextDirection = 'left';
                    }
                } else { // Moving left
                    nextX = prev.x - BOSS_SPEED;
                    // Check left boundary
                    if (nextX < 0) {
                        nextX = 0;
                        nextDirection = 'right';
                    }
                }
                return { x: nextX, direction: nextDirection };
            });

        }, 16); // Runs at about 60 frames per second!

        return () => clearInterval(gameTick);
    }, [keysPressed]); // This dependency is correct and efficient!

    // Keyboard event listeners (this part was already working perfectly!)
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

    // ✨ NEW: Style for our awesome tiled background! ✨
    const gameAreaStyle = {
        width: `${GAME_WIDTH}px`,
        height: `${GAME_HEIGHT}px`,
        backgroundImage: 'url(/space-tile.png)', // <-- ❗ Change this to your tile's filename!
        backgroundRepeat: 'repeat', // This makes the image tile seamlessly!
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
        transform: `translateX(${bossState.x}px)`,
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
                    src="/Warrior.png"
                    alt="Hero" 
                    style={playerStyle} 
                />
            </div>
        </div>
    );
}

export default SpaceDodgerGame;
