import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Constants are the same!
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60; // We can keep these for reference, even if we scale
const PLAYER_HEIGHT = 60;

function PhaserGame() {
const gameRef = useRef(null);
let player;
let cursors;

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
        // ✨ NEW IMAGE! Loading our wizard! ✨
        this.load.image('player', '/wizard.png'); // Assuming you have wizard.png in your public folder
    }

    function create() {
        const playerX = GAME_WIDTH / 2;
        const playerY = GAME_HEIGHT - 60;

        player = this.physics.add.sprite(playerX, playerY, 'player');
        player.setCollideWorldBounds(true);

        // ✨ NEW: Scaling down the wizard! ✨
        player.setScale(0.5); // 0.5 means half the original size!

        cursors = this.input.keyboard.createCursorKeys();
    }

    function update() {
        if (cursors.left.isDown) {
            player.setVelocityX(-300);
        } else if (cursors.right.isDown) {
            player.setVelocityX(300);
        } else {
            player.setVelocityX(0);
        }
    }

    return () => {
        gameRef.current.destroy(true);
    };

}, []);

return <div id="phaser-container" />;
}
