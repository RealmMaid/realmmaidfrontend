import React, { useState, useEffect, useRef } from 'react';

// Constants are all the same!
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 60;
const PLAYER_SPEED = 8;
const BOSS_WIDTH = 120;
const BOSS_HEIGHT = 80;
const BOSS_SPEED = 5;

function SpaceDodgerGame() {
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);
    const [keysPressed, setKeysPressed] = useState({});
    const [bossX, setBossX] = useState(0);

    // ✨ BUG FIX: Using a ref for the boss's direction! ✨
    // A ref is like a little box that holds a value. Unlike state, changing it
    // doesn't cause a re-render, which is perfect for our game loop!
    const bossDirectionRef = useRef('right');

    // ✨ BUG FIX: A brand new, super stable Game Loop! ✨
    useEffect(() => {
        const gameTick = setInterval(() => {
            // Player Movement (Now all in one place!)
            setPlayerX(prevX => {
                if (keysPressed['a'] || keysPressed['ArrowLeft']) {
                    return Math.max(0, prevX - PLAYER_SPEED);
                }
                if (keysPressed['d'] || keysPressed['ArrowRight']) {
                    return Math.min(GAME_WIDTH - PLAYER_WIDTH, prevX + PLAYER_SPEED);
                }
                return prevX; // If no movement keys are pressed, don't change anything!
            });

            // Boss Movement (Now also all in one place!)
            setBossX(prevX => {
                let newX = prevX;
                // We check the direction from our little ref box!
                if (bossDirectionRef.current === 'right') {
                    newX = prevX + BOSS_SPEED;
                    if (newX >= GAME_WIDTH - BOSS_WIDTH) {
                        newX = GAME_WIDTH - BOSS_WIDTH;
                        bossDirectionRef.current = 'left'; // We just flip the value in the box
                    }
                } else {
                    newX = prevX - BOSS_SPEED;
                    if (newX <= 0) {
                        newX = 0;
                        bossDirectionRef.current = 'right'; // And flip it back here!
                    }
                }
                return newX;
            });
        }, 16);

        return () => clearInterval(gameTick);
    }, [keysPressed]); // The loop ONLY depends on keysPressed, so it's super stable!

    // The keyboard listener is still perfect!
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

    // ✨ UPDATED: New style for our tiled background! ✨
    const gameAreaStyle = {
        width: `${GAME_WIDTH}px`,
        height: `${GAME_HEIGHT}px`,
        // backgroundColor: '#000000', // <-- Replaced this!
        backgroundImage: 'url(/space-tile.png)', // <-- Change to your tile's filename!
        backgroundRepeat: 'repeat', // This tells CSS to tile the image!
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
                    src="/Warrior.png"
                    alt="Hero" 
                    style={playerStyle} 
                />
            </div>
        </div>
    );
}

export default SpaceDodgerGame;
