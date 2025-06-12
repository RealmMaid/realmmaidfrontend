import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// --- PHASER SCENE DEFINITION ---
// This is the core of your game's logic. For now, it will be very simple.
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    // `preload` is for loading all your assets (images, sounds, etc.)
    preload() {
        console.log("Phaser: Preloading assets...");
        // Let's load the first boss image from your existing assets
        this.load.image('oryx1', '/oryx.png');
    }

    // `create` is for setting up the scene (placing sprites, adding text, etc.)
    create() {
        console.log("Phaser: Create method called!");
        
        // Add the boss image to the center of the scene
        this.add.image(400, 300, 'oryx1');
        
        // Add some text to confirm everything is working
        this.add.text(400, 50, 'Hello, Phaser!', { 
            font: '32px Arial', 
            fill: '#00ff00' 
        }).setOrigin(0.5);
    }

    // `update` is the game loop. It runs on every frame.
    // We will add all our game logic here later (DPS, healing, etc.)
    update(time, delta) {
        // This is where the magic will happen!
    }
}


// --- REACT COMPONENT DEFINITION ---
// This React component will render and manage the Phaser game above.
export function PhaserGame() {
    // A ref to hold the div that Phaser will render inside
    const phaserRef = useRef(null);
    // A ref to hold the game instance itself
    const gameInstanceRef = useRef(null);

    // This useEffect hook will run only ONCE when the component mounts
    useEffect(() => {
        // Do nothing if the ref isn't ready yet
        if (!phaserRef.current) {
            return;
        }

        const config = {
            type: Phaser.AUTO, // Automatically choose between WebGL or Canvas
            width: 800,
            height: 600,
            parent: phaserRef.current, // Tell Phaser to render in our div
            backgroundColor: '#1a0922', // A dark background
            scene: [MainScene] // The list of scenes to use
        };

        // Create the Phaser game instance, but only if it doesn't exist
        if (!gameInstanceRef.current) {
            console.log("Initializing Phaser game...");
            gameInstanceRef.current = new Phaser.Game(config);
        }

        // This is the cleanup function. It runs when the component unmounts.
        return () => {
            if (gameInstanceRef.current) {
                console.log("Destroying Phaser game...");
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
        };
    }, []); // The empty array ensures this effect runs only once

    // This div is the container where the Phaser canvas will be injected
    return (
        <div ref={phaserRef} id="phaser-container" />
    );
}

// Use a default export to match the lazy loading setup in your App.jsx
export default PhaserGame;
