import React, { useState, useEffect } from 'react';

// Constants are all the same
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
    const [bossX, setBossX] = useState((GAME_WIDTH - BOSS_WIDTH) / 2);
    const [bossDirection, setBossDirection] = useState('right');
    const [keysPressed, setKeysPressed] = useState({});

    useEffect(() => {
        const gameTick = setInterval(() => {
            // ✨ DETECTIVE LOGGING! ✨
            // This will print the game's state to the console on every tick!
            console.log(`Player X: ${playerX}, Boss X: ${bossX}, Boss Direction: ${bossDirection}`);

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

            // --- Boss Movement Logic (Direct Approach) ---
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

        }, 100); // Slowing down the interval just a little to make logs easier to read

        return () => clearInterval(gameTick);
    }, [keysPressed, bossX, bossDirection]);

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
