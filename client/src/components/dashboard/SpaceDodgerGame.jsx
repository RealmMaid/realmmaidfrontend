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
    // All of our state logic is exactly the same! Hehe.
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);
    const [keysPressed, setKeysPressed] = useState({});
    const [bossX, setBossX] = useState(0);
    const [bossDirection, setBossDirection] = useState('right');


    // The Game Loop useEffect is also exactly the same!
    // See? We're just changing how things *look*, not how they *work*.
    useEffect(() => {
        const gameTick = setInterval(() => {
            // Player movement
            if (keysPressed['a'] || keysPressed['ArrowLeft']) {
                setPlayerX(prevX => Math.max(0, prevX - PLAYER_SPEED));
            }
            if (keysPressed['d'] || keysPressed['ArrowRight']) {
                setPlayerX(prevX => Math.min(GAME_WIDTH - PLAYER_WIDTH, prevX + PLAYER_SPEED));
            }

            // Boss movement
            let newBossX = bossX;
            if (bossDirection === 'right') {
                newBossX += BOSS_SPEED;
                if (newBossX >= GAME_WIDTH - BOSS_WIDTH) {
                    newBossX = GAME_WIDTH - BOSS_WIDTH;
                    setBossDirection('left');
                }
            } else {
                newBossX -= BOSS_SPEED;
                if (newBossX <= 0) {
                    newBossX = 0;
                    setBossDirection('right');
                }
            }
            setBossX(newBossX);

        }, 16); 

        return () => clearInterval(gameTick);
    }, [keysPressed, bossX, bossDirection]);

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
    
    // ✨ UPDATED: Boss style no longer needs a background color! ✨
    const bossStyle = {
        width: `${BOSS_WIDTH}px`,
        height: `${BOSS_HEIGHT}px`,
        // backgroundColor: 'hotpink', // <-- We don't need this anymore!
        position: 'absolute',
        top: '30px',
        transform: `translateX(${bossX}px)`,
    };
    
    // ✨ UPDATED: Player style also doesn't need a background color! ✨
    const playerStyle = {
        width: `${PLAYER_WIDTH}px`,
        height: `${PLAYER_HEIGHT}px`,
        // backgroundColor: 'cyan', // <-- Or this one!
        position: 'absolute',
        bottom: '20px',
        transform: `translateX(${playerX}px)`,
    };

    return (
        <div style={{ fontFamily: 'monospace', color: 'white', textAlign: 'center' }}>
            <h2>Space Dodger! uwu</h2>
            <div style={gameAreaStyle}>
                {/* ✨ UPDATED: We're now using <img> tags instead of <div>s! ✨ */}
                <img 
                    src="/oryx.png" // <-- Change this to your boss image file!
                    alt="Oryx the Mad God" 
                    style={bossStyle} 
                />
                <img 
                    src="/Warrior.png" // <-- Change this to your player image file!
                    alt="Hero" 
                    style={playerStyle} 
                />
            </div>
        </div>
    );
}

export default SpaceDodgerGame;
