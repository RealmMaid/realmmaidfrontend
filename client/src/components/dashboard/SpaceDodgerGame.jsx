import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Make sure you've run 'npm install uuid'!

// Adding our projectile constants back!
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
    const canvasRef = useRef(null);
    const imageRef = useRef({ player: null, boss: null });

    // Game state
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);
    const [bossState, setBossState] = useState({
        x: (GAME_WIDTH - BOSS_WIDTH) / 2,
        direction: 'right',
    });
    const [keysPressed, setKeysPressed] = useState({});

    // ✨ Re-introducing our projectiles state! ✨
    const [projectiles, setProjectiles] = useState([]);

    // Image loading effect (unchanged)
    useEffect(() => {
        const playerImg = new Image();
        playerImg.src = '/Warrior.png';
        playerImg.onload = () => { imageRef.current.player = playerImg; };

        const bossImg = new Image();
        bossImg.src = '/oryx.png';
        bossImg.onload = () => { imageRef.current.boss = bossImg; };
    }, []);

    // --- Game Logic Loop ---
    useEffect(() => {
        const gameTick = setInterval(() => {
            // Player and Boss movement logic is the same!
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

            // ✨ Projectile movement logic is back! ✨
            setProjectiles(prevProjectiles =>
                prevProjectiles.map(p => ({ ...p, y: p.y + PROJECTILE_SPEED }))
                .filter(p => p.y < GAME_HEIGHT)
            );
        }, 16);
        return () => clearInterval(gameTick);
    }, [keysPressed]);

    // ✨ The projectile shooting timer is back! ✨
    useEffect(() => {
        const shootingTick = setInterval(() => {
            const newProjectile = {
                id: uuidv4(),
                x: bossState.x + (BOSS_WIDTH / 2) - (PROJECTILE_WIDTH / 2),
                y: 30 + BOSS_HEIGHT, // Spawn at the bottom of the boss
            };
            setProjectiles(prev => [...prev, newProjectile]);
        }, 2000);
        return () => clearInterval(shootingTick);
    }, [bossState.x]); // We depend on bossState.x so the projectile always comes from the right place!

    // --- Drawing Loop ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        const draw = () => {
            context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            context.fillStyle = 'black';
            context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            if (imageRef.current.boss) {
                context.drawImage(imageRef.current.boss, bossState.x, 30, BOSS_WIDTH, BOSS_HEIGHT);
            }
            if (imageRef.current.player) {
                context.drawImage(imageRef.current.player, playerX, GAME_HEIGHT - PLAYER_HEIGHT - 20, PLAYER_WIDTH, PLAYER_HEIGHT);
            }

            // ✨ Drawing all the projectiles! ✨
            context.fillStyle = 'white'; // Let's make them white!
            for (const p of projectiles) {
                context.fillRect(p.x, p.y, PROJECTILE_WIDTH, PROJECTILE_HEIGHT);
            }
        };
        
        let animationFrameId;
        const render = () => {
            draw();
            animationFrameId = window.requestAnimationFrame(render);
        };
        render();
        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [playerX, bossState, projectiles]); // ✨ We now need to re-draw when the projectiles array changes! ✨

    // Keyboard listeners (unchanged)
    useEffect(() => { /* ... */ }, []);

    return (
        <div style={{ fontFamily: 'monospace', color: 'white', textAlign: 'center' }}>
            <h2>Space Dodger! uwu</h2>
            <canvas
                ref={canvasRef}
                width={GAME_WIDTH}
                height={GAME_HEIGHT}
                style={{ border: '2px solid hotpink', borderRadius: '10px' }}
            />
        </div>
    );
}

export default SpaceDodgerGame;
