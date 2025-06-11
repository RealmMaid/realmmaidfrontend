import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Constants are the same!
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

function PhaserGame() {
    const gameRef = useRef(null);

    useEffect(() => {
        // ✨ UPDATED: The config object now has physics! ✨
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'phaser-container',
            backgroundColor: '#000000',
            // We add this new physics property to turn on the engine!
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 }, // We don't need things falling down, hehe
                    debug: false
                }
            },
            scene: {
                preload: preload,
                create: create,
                update: update
            }
        };

        gameRef.current = new Phaser.Game(config);

        // A variable to hold our player so we can access it in `update`
        let player;
        // A variable for our keyboard cursors
        let cursors;

        function preload() {
            this.load.image('player', '/wizard.png');
        }

        // ✨ UPDATED: The create function now sets up a physics sprite! ✨
        function create() {
            const playerX = GAME_WIDTH / 2;
            const playerY = GAME_HEIGHT - 60;

            // Instead of .add.sprite, we use .physics.add.sprite!
            // This creates a player that can move and collide with things.
            player = this.physics.add.sprite(playerX, playerY, 'player');

            // This is like an invisible force field! It stops the player from leaving the screen.
            player.setCollideWorldBounds(true);
            
            // This is Phaser's super easy way to listen for the arrow keys!
            cursors = this.input.keyboard.createCursorKeys();
        }

        // ✨ UPDATED: The update loop now handles movement! ✨
        function update() {
            // If the left arrow key is being held down...
            if (cursors.left.isDown) {
                // ...give the player a negative horizontal velocity to move left.
                player.setVelocityX(-300); // You can change this number to make him faster or slower!
            }
            // If the right arrow key is being held down...
            else if (cursors.right.isDown) {
                // ...give the player a positive horizontal velocity to move right.
                player.setVelocityX(300);
            }
            // If no movement keys are pressed...
            else {
                // ...stop the player completely!
                player.setVelocityX(0);
            }
        }

        return () => {
            gameRef.current.destroy(true);
        };

    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
