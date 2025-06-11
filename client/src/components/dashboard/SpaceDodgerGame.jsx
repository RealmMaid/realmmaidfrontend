import React, { useState, useEffect, useRef } from 'react';

// Constants are the same!
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 60;
const PLAYER_SPEED = 8;
const BOSS_WIDTH = 120;
const BOSS_HEIGHT = 80;
const BOSS_SPEED = 5;

function SpaceDodgerGame() {
    const canvasRef = useRef(null);

    // ✨ We're bringing back our game state! ✨
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);
    const [bossState, setBossState] = useState({
        x: (GAME_WIDTH - BOSS_WIDTH) / 2,
        direction: 'right',
    });
    const [keysPressed, setKeysPressed] = useState({});

    // --- Game Logic Loop ---
    // This useEffect handles all the game's "thinking" like movement.
    useEffect(() => {
        const gameTick = setInterval(() => {
            // Player Movement
            setPlayerX(prevX => {
                let newX = prevX;
                if (keysPressed['a'] || keysPressed['ArrowLeft']) { newX = prevX - PLAYER_SPEED; }
                if (keysPressed['d'] || keysPressed['ArrowRight']) { newX = prevX + PLAYER_SPEED; }
                return Math.max(0, Math.min(newX, GAME_WIDTH - PLAYER_WIDTH));
            });

            // Boss Movement
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
        }, 16); // Logic updates about 60 times per second

        return () => clearInterval(gameTick);
    }, [keysPressed]);

    // --- Drawing Loop ---
    // ✨ This new useEffect handles all the drawing! ✨
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Our new draw function!
        const draw = () => {
            // Clear the whole canvas every frame
            context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            // Draw the black background
            context.fillStyle = 'black';
            context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            // Draw the boss
            context.fillStyle = 'hotpink';
            context.fillRect(bossState.x, 30, BOSS_WIDTH, BOSS_HEIGHT);

            // Draw the player
            context.fillStyle = 'cyan';
            context.fillRect(playerX, GAME_HEIGHT - PLAYER_HEIGHT - 20, PLAYER_WIDTH, PLAYER_HEIGHT);
        };
        
        // We use requestAnimationFrame to create a super smooth drawing loop!
        let animationFrameId;
        const render = () => {
            draw();
            animationFrameId = window.requestAnimationFrame(render);
        };
        render();

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [playerX, bossState]); // We re-draw whenever the player or boss state changes!

    // Keyboard listeners (unchanged)
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
