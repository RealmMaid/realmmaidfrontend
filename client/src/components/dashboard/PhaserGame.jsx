import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Constants are the same!
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BOSS_SPEED = 150;

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
            this.load.image('boss', '/oryx.png');
        }

        function create() {
            // Create the player
            const playerX = GAME_WIDTH / 2;
            const playerY = GAME_HEIGHT - 60;
            this.player = this.physics.add.sprite(playerX, playerY, 'player');
            this.player.setCollideWorldBounds(true);

            // ✨ UPDATED: Making our little wizard even smaller! ✨
            this.player.setScale(0.4); // Changed from 0.5 to 0.4!
            
            // Create the keyboard listeners
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

            // Create the boss
            this.boss = this.physics.add.sprite(100, 80, 'boss');
            this.boss.setCollideWorldBounds(true);
            this.boss.setVelocityX(BOSS_SPEED);
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

            // ✨ UPDATED: Boss bouncing logic is now more reliable! ✨
            // We check if the physics body is "blocked" by the world bounds.
            if (this.boss.body.blocked.right) {
                // If he's blocked on the right, move left.
                this.boss.setVelocityX(-BOSS_SPEED);
            } else if (this.boss.body.blocked.left) {
                // If he's blocked on the left, move right.
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
