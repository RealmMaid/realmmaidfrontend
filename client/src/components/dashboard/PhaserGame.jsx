import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser'; // <-- The missing import is now here! ✨

// --- PHASER SCENE DEFINITION ---
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    init() {
        console.log("Phaser: Initializing game state...");
        this.gameState = {
            score: 0,
            pointsPerSecond: 0,
            currentBossIndex: 0,
            clicksOnCurrentBoss: 0,
        };
    }

    preload() {
        console.log("Phaser: Preloading assets...");
        this.load.image('oryx1', '/oryx.png');
    }

    create() {
        console.log("Phaser: Create method called!");
        
        this.add.image(400, 300, 'oryx1');
        
        this.scoreText = this.add.text(50, 50, `Fame: ${this.gameState.score}`, { 
            font: '24px "Press Start 2P"',
            fill: '#ffffff' 
        });
    }

    update(time, delta) {
        // The game loop!
    }
}


// --- REACT COMPONENT DEFINITION ---
export function PhaserGame() {
    const phaserRef = useRef(null);
    const gameInstanceRef = useRef(null);

    useEffect(() => {
        if (!phaserRef.current) {
            return;
        }

        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: phaserRef.current,
            backgroundColor: '#1a0922',
            scene: [MainScene]
        };

        if (!gameInstanceRef.current) {
            console.log("Initializing Phaser game...");
            gameInstanceRef.current = new Phaser.Game(config);
        }

        return () => {
            if (gameInstanceRef.current) {
                console.log("Destroying Phaser game...");
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div ref={phaserRef} id="phaser-container" />
    );
}

export default PhaserGame;
