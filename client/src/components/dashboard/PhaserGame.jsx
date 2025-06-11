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
            scene: {
                preload: preload,
                create: create,
                update: update
            }
        };

        gameRef.current = new Phaser.Game(config);

        // ✨ UPDATED: The preload function! ✨
        function preload() {
            // We tell Phaser to load our image and give it a cute nickname, 'player'!
            this.load.image('player', '/Warrior.png'); // Make sure this path is correct!
        }

        // ✨ UPDATED: The create function! ✨
        function create() {
            // We're creating a "sprite" at the bottom-center of the screen
            // using the image we nicknamed 'player'!
            const playerX = GAME_WIDTH / 2;
            const playerY = GAME_HEIGHT - 60;
            this.add.sprite(playerX, playerY, 'player');
        }

        function update() {
            // The game loop is still empty for now!
        }

        return () => {
            gameRef.current.destroy(true);
        };

    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
