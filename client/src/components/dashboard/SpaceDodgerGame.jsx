import React, { useState, useEffect } from 'react';

// These constants are now even more important!
// They control the size of our images on the screen.
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60; // You can adjust these to fit your image!
const PLAYER_HEIGHT = 60;
const PLAYER_SPEED = 8;
const BOSS_WIDTH = 120; // And these too!
const BOSS_HEIGHT = 80;
const BOSS_SPEED = 5;

function SpaceDodgerGame() {
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);
    const [keysPressed, setKeysPressed] = useState({});

    // ✨ UPDATED: Boss's state is now in one cute object! ✨
    // This replaces the separate bossX and bossDirection states.
    const [bossState, setBossState] = useState({
        x: 0,
        direction: 'right',
    });

    // ✨ UPDATED: The Game Loop is now cleaner and more stable! ✨
    useEffect(() => {
        const gameTick = setInterval(() => {
            // Player movement (this part is still perfect!)
            if (keysPressed['a'] || keysPressed['ArrowLeft']) {
                setPlayerX(prevX => Math.max(0, prevX - PLAYER_SPEED));
            }
            if (keysPressed['d'] || keysPressed['ArrowRight']) {
                setPlayerX(prevX => Math.min(GAME_WIDTH - PLAYER_WIDTH, prevX + PLAYER_SPEED));
            }

            // Boss movement logic using our new state object!
            setBossState(prev => {
                let newX = prev.x;
                let newDirection = prev.direction;

                if (prev.direction === 'right') {
                    newX += BOSS_SPEED;
                    if (newX >= GAME_WIDTH - BOSS_WIDTH) {
                        newX = GAME_WIDTH - BOSS_WIDTH; // Clamp to the edge
                        newDirection = 'left'; // And flip direction
                    }
                } else { // Moving left
                    newX -= BOSS_SPEED;
                    if (newX <= 0) {
                        newX = 0; // Clamp to the edge
                        newDirection = 'right'; // And flip direction
                    }
                }
                // Return the whole new state object!
                return { x: newX, direction: newDirection };
            });

        }, 16); 

        return () => clearInterval(gameTick);
    }, [keysPressed]); // ✨ UPDATED: The dependency array is cleaner now! ✨

    // The keyboard listener useEffect is also the same!
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

    // Styles for our game elements!
    const gameAreaStyle = {
        width: `${GAME_WIDTH}px`,
        height: `${GAME_HEIGHT}px`,
        backgroundColor: '#000000',
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
        // ✨ UPDATED: Read the x position from our new bossState object! ✨
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
                    src="/warrior.png"
                    alt="Hero" 
                    style={playerStyle} 
                />
            </div>
        </div>
    );
}

export default SpaceDodgerGame;
