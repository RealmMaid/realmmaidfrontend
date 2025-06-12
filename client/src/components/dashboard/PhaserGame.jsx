import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import EventBus from '../../EventBus';

// --- This is the core of our game's logic ---
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    // `init` is called when the scene starts. It sets up our initial state.
    init() {
        this.gameState = {
            score: 0,
        };
    }

    // `preload` loads all our assets like images and sounds.
    preload() {
        this.load.image('oryx1', '/oryx.png');
        this.load.audio('oryx_hit', '/oryxhit.mp3');
    }

    // `create` sets up the scene when it's ready.
    create() {
        const bossImage = this.add.image(400, 300, 'oryx1');

        // Make the boss sprite interactive
        bossImage.setInteractive({ useHandCursor: true });

        // Set up the click event listener
        bossImage.on('pointerdown', () => {
            // 1. Update the internal game state
            this.gameState.score += 1;
            
            // 2. Emit an event to tell React about the change
            EventBus.emit('scoreUpdated', this.gameState.score);
            
            // 3. Play feedback
            this.sound.play('oryx_hit', { volume: 0.5 });
            this.tweens.add({
                targets: bossImage,
                scale: 0.9,
                duration: 50,
                yoyo: true,
                ease: 'Power1'
            });
        });
    }
}


// --- This is the React component that will render our Phaser game ---
function PhaserGame() {
    const phaserRef = useRef(null);
    const gameInstanceRef = useRef(null);

    // This hook creates and cleans up the Phaser game instance
    useEffect(() => {
        if (!phaserRef.current) return;

        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: phaserRef.current,
            backgroundColor: '#1a0922',
            scene: [MainScene]
        };

        // Create the game instance only once
        if (!gameInstanceRef.current) {
            gameInstanceRef.current = new Phaser.Game(config);
        }

        // Cleanup function to destroy the game when the component unmounts
        return () => {
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
        };
    }, []);

    // This div is the container where Phaser will inject its canvas
    return <div ref={phaserRef} id="phaser-container" />;
}

export default PhaserGame;
