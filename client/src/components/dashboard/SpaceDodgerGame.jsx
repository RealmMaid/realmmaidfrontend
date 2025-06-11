import React, { useState, useEffect, useRef } from 'react'; // ✨ Add useRef to our imports! ✨
import { v4 as uuidv4 } from 'uuid';

// Constants are all the same!
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
    const [projectiles, setProjectiles] = useState([]);

    // ✨ NEW: The "Magic Mirror" ref! ✨
    // This will always hold the latest boss position for our timer.
    const bossXRef = useRef(bossState.x);

    // This little effect's only job is to keep our ref updated!
    useEffect(() => {
        bossXRef.current = bossState.x;
    }, [bossState.x]);


    // The stable game loop (unchanged)
    useEffect(() => {
        const gameTick = setInterval(() => {
            // Player, Boss, and Projectile movement logic is all perfect!
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

            setProjectiles(prevProjectiles => 
                prevProjectiles.map(p => ({ ...p, y: p.y + PROJECTILE_SPEED }))
                .filter(p => p.y < GAME_HEIGHT)
            );

        }, 16);
        return () => clearInterval(gameTick);
    }, [keysPressed]);

    // ✨ UPDATED: A stable timer for shooting! ✨
    useEffect(() => {
        const shootingTick = setInterval(() => {
            const newProjectile = {
                id: uuidv4(),
                // It reads the position from our magic mirror ref!
                x: bossXRef.current + (BOSS_WIDTH / 2) - (PROJECTILE_WIDTH / 2),
                y: BOSS_HEIGHT + 30,
            };
            setProjectiles(prev => [...prev, newProjectile]);
        }, 2000);

        return () => clearInterval(shootingTick);
    }, []); // The empty array [] means this timer runs once and NEVER restarts! Yay!

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

    // All the styles are the same!
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
    const bossStyle = { width: `${BOSS_WIDTH}px`, height: `${BOSS_HEIGHT}px`, position: 'absolute', top: '30px', transform: `translateX(${bossState.x}px)`};
    const playerStyle = { width: `${PLAYER_WIDTH}px`, height: `${PLAYER_HEIGHT}px`, position: 'absolute', bottom: '20px', transform: `translateX(${playerX}px)`};
    const projectileStyle = { width: `${PROJECTILE_WIDTH}px`, height: `${PROJECTILE_HEIGHT}px`, backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 0 15px white', position: 'absolute' };

    return (
        <div style={{ fontFamily: 'monospace', color: 'white', textAlign: 'center' }}>
            <h2>Space Dodger! uwu</h2>
            <div style={gameAreaStyle}>
                {projectiles.map(p => (
                    <div 
                        key={p.id} 
                        style={{ ...projectileStyle, top: `${p.y}px`, left: `${p.x}px` }}
                    ></div>
                ))}
                <img className="game-sprite" src="/oryx.png" alt="Oryx the Mad God" style={bossStyle} />
                <img className="game-sprite" src="/Warrior.png" alt="Hero" style={playerStyle} />
            </div>
        </div>
    );
}

export default SpaceDodgerGame;
