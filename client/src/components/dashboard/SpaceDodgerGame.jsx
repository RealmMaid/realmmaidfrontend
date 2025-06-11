import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Constants for our game world
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
const PLAYER_INITIAL_HEALTH = 3; // Let's start with 3 hearts! <3

// ✨ NEW: A helper function to check for collisions! ✨
// It just checks if two rectangles are overlapping.
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}


function SpaceDodgerGame() {
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);
    const [bossState, setBossState] = useState({
        x: (GAME_WIDTH - BOSS_WIDTH) / 2,
        direction: 'right',
    });
    const [keysPressed, setKeysPressed] = useState({});
    const [projectiles, setProjectiles] = useState([]);

    // ✨ NEW: State for player health and game over status! ✨
    const [playerHealth, setPlayerHealth] = useState(PLAYER_INITIAL_HEALTH);
    const [isGameOver, setIsGameOver] = useState(false);

    // The main game loop
    useEffect(() => {
        // If the game is over, we stop the whole loop!
        if (isGameOver) return;

        const gameTick = setInterval(() => {
            // Player and Boss movement logic (unchanged)
            setPlayerX(prevX => {
                let newX = prevX;
                if (keysPressed['a'] || keysPressed['ArrowLeft']) { newX = prevX - PLAYER_SPEED; }
                if (keysPressed['d'] || keysPressed['ArrowRight']) { newX = prevX + PLAYER_SPEED; }
                return Math.max(0, Math.min(newX, GAME_WIDTH - PLAYER_WIDTH));
            });

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

            // ✨ NEW: Collision Detection and projectile updates! ✨
            setProjectiles(prevProjectiles => {
                const playerRect = { x: playerX, y: GAME_HEIGHT - PLAYER_HEIGHT - 20, width: PLAYER_WIDTH, height: PLAYER_HEIGHT };
                const projectilesToRemove = new Set();
                
                // Check each projectile for a collision
                for (const projectile of prevProjectiles) {
                    const projectileRect = { x: projectile.x, y: projectile.y, width: PROJECTILE_WIDTH, height: PROJECTILE_HEIGHT };
                    if (checkCollision(playerRect, projectileRect)) {
                        projectilesToRemove.add(projectile.id);
                        // Using a function here to make sure we're updating based on the latest health!
                        setPlayerHealth(prevHealth => prevHealth - 1);
                    }
                }

                // Return a new list of projectiles...
                return prevProjectiles
                    // ...with their positions updated
                    .map(p => ({ ...p, y: p.y + PROJECTILE_SPEED }))
                    // ...and filter out any that hit the player or went off-screen
                    .filter(p => p.y < GAME_HEIGHT && !projectilesToRemove.has(p.id));
            });

        }, 16);
        return () => clearInterval(gameTick);
    }, [keysPressed, isGameOver, playerX]); // Added playerX to ensure playerRect is always up-to-date

    // A separate timer for shooting (unchanged)
    useEffect(() => {
        if (isGameOver) return; // Don't shoot if the game is over!
        // ... (rest of the shooting logic is the same)
    }, [bossState.x, isGameOver]);

    // ✨ NEW: An effect to check if the game should be over! ✨
    useEffect(() => {
        if (playerHealth <= 0) {
            setIsGameOver(true);
        }
    }, [playerHealth]);

    // Keyboard event listeners (unchanged)
    useEffect(() => { /* ... */ }, []);

    // ✨ NEW: A function to restart the game! ✨
    const handleRestart = () => {
        setPlayerX((GAME_WIDTH - PLAYER_WIDTH) / 2);
        setBossState({ x: (GAME_WIDTH - BOSS_WIDTH) / 2, direction: 'right' });
        setProjectiles([]);
        setPlayerHealth(PLAYER_INITIAL_HEALTH);
        setIsGameOver(false);
    };

    // All the styles are unchanged...
    const gameAreaStyle = { /* ... */ };
    const bossStyle = { /* ... */ };
    const playerStyle = { /* ... */ };
    const projectileStyle = { /* ... */ };
    
    // ✨ NEW: A style for our Game Over screen! ✨
    const gameOverStyle = {
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    };

    return (
        <div style={{ fontFamily: 'monospace', color: 'white', textAlign: 'center' }}>
            <h2>Space Dodger! uwu</h2>
            <div style={gameAreaStyle}>
                {/* ✨ NEW: Conditionally render the Game Over screen! ✨ */}
                {isGameOver ? (
                    <div style={gameOverStyle}>
                        <h1>GAME OVER</h1>
                        <p>T_T You did your best!</p>
                        <button onClick={handleRestart} style={{padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer'}}>
                            Try Again?
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Health Display */}
                        <div style={{position: 'absolute', top: '10px', left: '10px', fontSize: '2rem'}}>
                            {Array(playerHealth).fill('❤️').join('')}
                        </div>

                        {/* All our game objects! */}
                        {projectiles.map(p => (
                            <div key={p.id} style={{ ...projectileStyle, top: `${p.y}px`, left: `${p.x}px` }}></div>
                        ))}
                        <img className="game-sprite" src="/oryx.png" alt="Oryx the Mad God" style={bossStyle} />
                        <img className="game-sprite" src="/Warrior.png" alt="Hero" style={playerStyle} />
                    </>
                )}
            </div>
        </div>
    );
}

export default SpaceDodgerGame;
