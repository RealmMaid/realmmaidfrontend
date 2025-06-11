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
    const canvasRef = useRef(null);
    // ✨ NEW: A ref to hold our loaded image objects! ✨
    const imageRef = useRef({
        player: null,
        boss: null,
    });

    // All our game state is the same!
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);
    const [bossState, setBossState] = useState({
        x: (GAME_WIDTH - BOSS_WIDTH) / 2,
        direction: 'right',
    });
    const [keysPressed, setKeysPressed] = useState({});
    
    // ✨ NEW: This effect loads our images when the game starts! ✨
    useEffect(() => {
        const playerImg = new Image();
        playerImg.src = '/wizard.png'; // Make sure this path is correct!
        playerImg.onload = () => {
            imageRef.current.player = playerImg;
        };

        const bossImg = new Image();
        bossImg.src = '/oryx.png'; // And this one too!
        bossImg.onload = () => {
            imageRef.current.boss = bossImg;
        };
    }, []);


    // --- Game Logic Loop (unchanged) ---
    useEffect(() => {
        const gameTick = setInterval(() => {
            // Player and Boss movement logic is all perfect!
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
        }, 16);
        return () => clearInterval(gameTick);
    }, [keysPressed]);

    // --- Drawing Loop ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        const draw = () => {
            context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            context.fillStyle = 'black';
            context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            // ✨ UPDATED: We now draw the images instead of colored boxes! ✨
            // We check if the image has loaded before trying to draw it!
            if (imageRef.current.boss) {
                context.drawImage(imageRef.current.boss, bossState.x, 30, BOSS_WIDTH, BOSS_HEIGHT);
            }
            if (imageRef.current.player) {
                context.drawImage(imageRef.current.player, playerX, GAME_HEIGHT - PLAYER_HEIGHT - 20, PLAYER_WIDTH, PLAYER_HEIGHT);
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
    }, [playerX, bossState]);

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
