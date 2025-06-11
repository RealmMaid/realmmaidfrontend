import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // ✨ NEW: Import our little ID generator! ✨

// Added constants for our new projectiles!
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 60;
const PLAYER_SPEED = 8;
const BOSS_WIDTH = 120;
const BOSS_HEIGHT = 80;
const BOSS_SPEED = 5;
const PROJECTILE_WIDTH = 8;
const PROJECTILE_HEIGHT = 25;
const PROJECTILE_SPEED = 10;

function SpaceDodgerGame() {
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);
    const [bossState, setBossState] = useState({
        x: (GAME_WIDTH - BOSS_WIDTH) / 2,
        direction: 'right',
    });
    const [keysPressed, setKeysPressed] = useState({});
    
    // ✨ NEW: A state to hold all the active projectiles! ✨
    const [projectiles, setProjectiles] = useState([]);

    // The stable game loop
    useEffect(() => {
        const gameTick = setInterval(() => {
            // --- Player Movement Logic (unchanged) ---
            setPlayerX(prevX => {
                let newX = prevX;
                if (keysPressed['a'] || keysPressed['ArrowLeft']) { newX = prevX - PLAYER_SPEED; }
                if (keysPressed['d'] || keysPressed['ArrowRight']) { newX = prevX + PLAYER_SPEED; }
                return Math.max(0, Math.min(newX, GAME_WIDTH - PLAYER_WIDTH));
            });

            // --- Boss Movement Logic (unchanged) ---
            setBossState(prev => {
                let nextX = prev.x;
                let nextDirection = prev.direction;
                if (prev.direction === 'right') {
                    nextX = prev.x + BOSS_SPEED;
                    if (nextX > GAME_WIDTH - BOSS_WIDTH) { nextX = GAME_WIDTH - BOSS_WIDTH; nextDirection = 'left'; }
                } else {
                    nextX = prev.x - BOSS_SPEED;
                    if (nextX < 0) { nextX = 0; nextDirection = 'right'; }
                }
                return { x: nextX, direction: nextDirection };
            });

            // ✨ NEW: Projectile Movement Logic! ✨
            setProjectiles(prevProjectiles => 
                // First, move every projectile down
                prevProjectiles.map(p => ({ ...p, y: p.y + PROJECTILE_SPEED }))
                // Then, filter out any that have gone off the screen
                .filter(p => p.y < GAME_HEIGHT)
            );

        }, 16);
        return () => clearInterval(gameTick);
    }, [keysPressed]); // Dependency array is still stable!

    // ✨ NEW: A separate timer just for shooting! ✨
    useEffect(() => {
        const shootingTick = setInterval(() => {
            // Create a new projectile!
            const newProjectile = {
                id: uuidv4(), // A unique ID so React doesn't get confused!
                // Start it at the center of the boss
                x: bossState.x + (BOSS_WIDTH / 2) - (PROJECTILE_WIDTH / 2),
                // Start it at the bottom of the boss
                y: BOSS_HEIGHT + 30, // The 30 is the 'top' position of the boss
            };
            // Add our new projectile to the list!
            setProjectiles(prev => [...prev, newProjectile]);

        }, 2000); // Shoots every 2 seconds! You can change this!

        return () => clearInterval(shootingTick);
    }, [bossState.x]); // This timer resets when the boss moves, so it always has the correct position!

    // Keyboard event listeners (unchanged)
    useEffect(() => {
        const handleKeyDown = (e) => { setKeysPressed(prev => ({ ...prev, [e.key]: true })); };
        const handleKeyUp = (e) => { setKeysPressed(prev => ({ ...prev, [e.key]: false })); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Styles
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
        transform: `translateX(${bossState.x}px)`,
    };
    
    const playerStyle = {
        width: `${PLAYER_WIDTH}px`,
        height: `${PLAYER_HEIGHT}px`,
        position: 'absolute',
        bottom: '20px',
        transform: `translateX(${playerX}px)`,
    };

    // ✨ NEW: A style for our projectiles! ✨
    const projectileStyle = {
        width: `${PROJECTILE_WIDTH}px`,
        height: `${PROJECTILE_HEIGHT}px`,
        backgroundColor: 'white', // ✨ Changed from 'hotpink' to 'white'!
        borderRadius: '4px',
        boxShadow: '0 0 15px white', // ✨ Let's make the glow white too! So pretty!
        position: 'absolute',
    };


    return (
        <div style={{ fontFamily: 'monospace', color: 'white', textAlign: 'center' }}>
            <h2>Space Dodger! uwu</h2>
            <div style={gameAreaStyle}>
                {/* ✨ NEW: We draw all the projectiles here! ✨ */}
                {projectiles.map(p => (
                    <div 
                        key={p.id} 
                        style={{
                            ...projectileStyle,
                            top: `${p.y}px`,
                            left: `${p.x}px`,
                        }}
                    ></div>
                ))}

                <img className="game-sprite" src="/oryx.png" alt="Oryx the Mad God" style={bossStyle} />
                <img className="game-sprite" src="/wizard.png" alt="Hero" style={playerStyle} />
            </div>
        </div>
    );
}

export default SpaceDodgerGame;
