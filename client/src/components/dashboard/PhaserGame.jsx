import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Constants are the same!
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BOSS_SPEED = 150; // Let's define the boss's speed up here!

function PhaserGame() {
    const gameRef = useRef(null);

    useEffect(() => {
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'phaser-container',
            backgroundColor: '#000000',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
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

        function preload() {
            this.load.image('player', '/wizard.png');
            // ✨ NEW: Loading our boss image! ✨
            this.load.image('boss', '/oryx.png');
        }

        function create() {
            // Create the player
            const playerX = GAME_WIDTH / 2;
            const playerY = GAME_HEIGHT - 60;
            this.player = this.physics.add.sprite(playerX, playerY, 'player');
            this.player.setCollideWorldBounds(true);
            this.player.setScale(0.5);
            
            // Create the keyboard listeners
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

            // ✨ NEW: Create the boss sprite! ✨
            this.boss = this.physics.add.sprite(100, 80, 'boss'); // Start him near the top-left
            this.boss.setCollideWorldBounds(true); // He also can't leave the screen!
            this.boss.setVelocityX(BOSS_SPEED); // Give him a little push to the right to start!
        }

        function update() {
            // Player movement logic (unchanged)
            if (this.cursors.left.isDown || this.keyA.isDown) {
                this.player.setVelocityX(-300);
            }
            else if (this.cursors.right.isDown || this.keyD.isDown) {
                this.player.setVelocityX(300);
            }
            else {
                this.player.setVelocityX(0);
            }

            // ✨ NEW: Boss bouncing logic! ✨
            // Phaser's physics body tells us if it's touching a wall!
            if (this.boss.body.touching.right) {
                // If he touches the right wall, reverse his velocity to go left.
                this.boss.setVelocityX(-BOSS_SPEED);
            } else if (this.boss.body.touching.left) {
                // If he touches the left wall, reverse his velocity to go right.
                this.boss.setVelocityX(BOSS_SPEED);
            }
        }

        return () => {
            gameRef.current.destroy(true);
        };

    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
