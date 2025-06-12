import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser'; // <-- The important import!

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
        this.load.audio('oryx_hit', '/oryxhit.mp3');
    }

    create() {
        console.log("Phaser: Create method called!");
        
        const bossImage = this.add.image(400, 300, 'oryx1');

        // --- Make the boss interactive ---
        bossImage.setInteractive({ useHandCursor: true });
        bossImage.on('pointerdown', () => {
            // Update the game state
            this.gameState.score += 1;
            this.gameState.clicksOnCurrentBoss += 1;

            // Update the score text UI
            this.scoreText.setText(`Fame: ${this.gameState.score}`);

            // Play sound and visual feedback
            this.sound.play('oryx_hit', { volume: 0.5 });
            this.tweens.add({
                targets: bossImage,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 50,
                yoyo: true,
                ease: 'Power1'
            });
        });
        
        // --- UI Elements ---
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
            gameInstanceRef.current = new Phaser.Game(config);
        }

        return () => {
            if (gameInstanceRef.current) {
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
