import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Constants are the same!
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

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
        }

        function create() {
            const playerX = GAME_WIDTH / 2;
            const playerY = GAME_HEIGHT - 60;

            // We add `this.` to make the player available in our other functions!
            this.player = this.physics.add.sprite(playerX, playerY, 'player');
            this.player.setCollideWorldBounds(true);
            this.player.setScale(0.5);
            
            this.cursors = this.input.keyboard.createCursorKeys();

            // ✨ NEW: Let's also create keys for A and D! ✨
            this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        }

        function update() {
            // ✨ UPDATED: The movement logic now checks for A and D too! ✨
            // The || means OR, so it moves if the arrow key OR the letter key is pressed!
            if (this.cursors.left.isDown || this.keyA.isDown) {
                this.player.setVelocityX(-300);
            }
            else if (this.cursors.right.isDown || this.keyD.isDown) {
                this.player.setVelocityX(300);
            }
            else {
                this.player.setVelocityX(0);
            }
        }

        return () => {
            gameRef.current.destroy(true);
        };

    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
