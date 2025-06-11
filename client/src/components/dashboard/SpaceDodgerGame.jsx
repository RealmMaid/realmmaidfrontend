import React, { useState, useEffect } from 'react';

// Added some new numbers for our big boss! owo
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const PLAYER_SPEED = 8;
const BOSS_WIDTH = 100;
const BOSS_HEIGHT = 60;
const BOSS_SPEED = 5;

function SpaceDodgerGame() {
    // Player's state, just as before!
    const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);
    const [keysPressed, setKeysPressed] = useState({});

    // ✨ NEW: State for our boss! ✨
    // This remembers the boss's left/right position
    const [bossX, setBossX] = useState(0);
    // And this remembers if it's going 'left' or 'right'
    const [bossDirection, setBossDirection] = useState('right');


    // This is our Game Loop!
    useEffect(() => {
        const gameTick = setInterval(() => {
            // Player movement logic (this part is the same!)
            if (keysPressed['a'] || keysPressed['ArrowLeft']) {
                setPlayerX(prevX => Math.max(0, prevX - PLAYER_SPEED));
            }
            if (keysPressed['d'] || keysPressed['ArrowRight']) {
                setPlayerX(prevX => Math.min(GAME_WIDTH - PLAYER_WIDTH, prevX + PLAYER_SPEED));
            }

            // ✨ NEW: Boss movement logic! ✨
            // We're gonna calculate the boss's next move here!
            let newBossX = bossX;
            if (bossDirection === 'right') {
                newBossX += BOSS_SPEED;
                // If the boss hits the right wall...
                if (newBossX >= GAME_WIDTH - BOSS_WIDTH) {
                    newBossX = GAME_WIDTH - BOSS_WIDTH; // Stop it from going off-screen
                    setBossDirection('left'); // ...tell it to move left now!
                }
            } else { // If we're going left...
                newBossX -= BOSS_SPEED;
                // If the boss hits the left wall...
                if (newBossX <= 0) {
                    newBossX = 0; // Stop it from going off-screen
                    setBossDirection('right'); // ...tell it to move right now!
                }
            }
            // Update the boss's position!
            setBossX(newBossX);

        }, 16); 

        return () => clearInterval(gameTick);
    }, [keysPressed, bossX, bossDirection]); // We need to add bossX and bossDirection here!

    // This effect for listening to keys is exactly the same!
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
    
    // ✨ NEW: A super cute style for our boss! ✨
    const bossStyle = {
        width: `${BOSS_WIDTH}px`,
        height: `${BOSS_HEIGHT}px`,
        backgroundColor: 'hotpink', // Let's make it match the border! :3
        borderRadius: '5px',
        position: 'absolute',
        top: '30px', // At the top of the screen
        transform: `translateX(${bossX}px)`, // This moves it left and right!
    };

    const playerStyle = {
        width: `${PLAYER_WIDTH}px`,
        height: `${PLAYER_HEIGHT}px`,
        backgroundColor: 'cyan',
        borderRadius: '5px',
        position: 'absolute',
        bottom: '20px',
        transform: `translateX(${playerX}px)`,
    };

    return (
        <div style={{ fontFamily: 'monospace', color: 'white', textAlign: 'center' }}>
            <h2>Space Dodger! uwu</h2>
            <div style={gameAreaStyle}>
                {/* We just add our boss div right here! */}
                <div style={bossStyle}></div> 
                <div style={playerStyle}></div>
            </div>
        </div>
    );
}

export default SpaceDodgerGame;
