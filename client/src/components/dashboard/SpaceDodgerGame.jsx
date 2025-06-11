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

// This is our known-good, 100% working component logic!
function SpaceDodgerGame() {
    // Player state, starting in the middle.
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);

    // Boss state, in a single object for stability, starting centered.
    const [bossState, setBossState] = useState({
        x: (GAME_WIDTH - BOSS_WIDTH) / 2,
        direction: 'right',
    });
    
    // State to track which keys are currently being held down.
    const [keysPressed, setKeysPressed] = useState({});

    // The stable game loop
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
                return Math.max(0, Math.min(newX, GAME_WIDTH - PLAYER_WIDTH));
            });

            // --- Boss Movement Logic ---
            setBossState(prev => {
                let nextX = prev.x;
                let nextDirection = prev.direction;

                if (prev.direction === 'right') {
                    nextX = prev.x + BOSS_SPEED;
                    if (nextX > GAME_WIDTH - BOSS_WIDTH) {
                        nextX = GAME_WIDTH - BOSS_WIDTH;
                        nextDirection = 'left';
                    }
                } else { // Moving left
                    nextX = prev.x - BOSS_SPEED;
                    if (nextX < 0) {
                        nextX = 0;
                        nextDirection = 'right';
                    }
                }
                return { x: nextX, direction: nextDirection };
            });
        }, 16);

        return () => clearInterval(gameTick);
    }, [keysPressed]);

    // Keyboard event listeners
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

    // Styles - these are self-contained and we know they work.
    const gameAreaStyle = {
        width: `${GAME_WIDTH}px`,
        height: `${GAME_HEIGHT}px`,
        backgroundImage: 'url(/space-tile.png)',
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
        backgroundColor: 'hotpink',
        position: 'absolute',
        top: '30px',
        transform: `translateX(${bossState.x}px)`,
    };
    
    const playerStyle = {
        width: `${PLAYER_WIDTH}px`,
        height: `${PLAYER_HEIGHT}px`,
        backgroundColor: 'cyan',
        position: 'absolute',
        bottom: '20px',
        transform: `translateX(${playerX}px)`,
    };

    return (
        <div style={{ fontFamily: 'monospace', color: 'white', textAlign: 'center' }}>
            <h2>Space Dodger! uwu</h2>
            <div style={gameAreaStyle}>
                <div style={bossStyle}></div>
                <div style={playerStyle}></div>
            </div>
        </div>
    );
}

export default SpaceDodgerGame;
