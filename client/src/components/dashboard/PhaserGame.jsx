import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

function PhaserGame() {
    // This ref will hold our game instance.
    const gameRef = useRef(null);

    // This is where all the Phaser magic happens!
    useEffect(() => {
        // The game configuration object. This is like the settings menu!
        const config = {
            type: Phaser.AUTO, // Automatically chooses WebGL or Canvas
            width: 800,
            height: 600,
            parent: 'phaser-container', // The ID of the div our game will live in
            backgroundColor: '#000000',
            // A scene is like a single screen or level in a game.
            scene: {
                preload: preload,
                create: create,
                update: update
            }
        };

        // Create the new Phaser Game instance!
        gameRef.current = new Phaser.Game(config);

        // This is the heart of our game!
        // preload() is for loading assets like images and sounds.
        function preload() {
            // We'll load our images here later!
        }

        // create() runs once at the beginning to set up the game world.
        function create() {
            // Let's add some cute text to make sure it's working!
            // 'this' refers to the Scene object.
            this.add.text(400, 300, 'Our Phaser Game is ALIVE! uwu', { 
                fontSize: '32px', 
                fill: '#ff69b4' // A hot pink color, of course!
            }).setOrigin(0.5); // This centers the text on its coordinates.
        }

        // update() is the game loop! It runs over and over.
        function update() {
            // We'll make our characters move in here later!
        }

        // This is a super important cleanup function!
        // It destroys the game when the component unmounts to prevent memory leaks.
        return () => {
            gameRef.current.destroy(true);
        };

    }, []); // The empty array makes sure this effect only runs once!

    // Our component just renders a single div for the game to attach to.
    return <div id="phaser-container" />;
}

export default PhaserGame;
