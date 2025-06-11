import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BOSS_SPEED = 150;
const PROJECTILE_SPEED = 400;

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
            // ✨ NEW: Let's load a little image for our laser! ✨
            this.load.image('laser', '/beamslash.png'); // You'll need to create a small image for this!
        }

        function create() {
            // Create player
            this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'player');
            this.player.setCollideWorldBounds(true);
            this.player.setScale(0.4);
            
            // Create keyboard listeners
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

            // Create boss
            this.boss = this.physics.add.sprite(100, 80, 'boss');
            this.boss.setCollideWorldBounds(true);
            this.boss.setVelocityX(BOSS_SPEED);

            // ✨ NEW: Create our magical box for projectiles! ✨
            this.projectiles = this.physics.add.group({
                defaultKey: 'laser',
                maxSize: 30 // We won't have more than 30 lasers on screen at once
            });

            // ✨ NEW: A Phaser timer to make the boss shoot! ✨
            this.time.addEvent({
                delay: 1500, // Shoots every 1.5 seconds
                callback: () => {
                    // This function gets a laser from our group.
                    // If there are no inactive lasers to recycle, it creates a new one!
                    const laser = this.projectiles.get(this.boss.x, this.boss.y + 60);
                    if (laser) {
                        laser.setActive(true);
                        laser.setVisible(true);
                        laser.setVelocityY(PROJECTILE_SPEED);
                    }
                },
                loop: true
            });
        }

        function update() {
            // Player movement logic (unchanged)
            if (this.cursors.left.isDown || this.keyA.isDown) {
                this.player.setVelocityX(-300);
            } else if (this.cursors.right.isDown || this.keyD.isDown) {
                this.player.setVelocityX(300);
            } else {
                this.player.setVelocityX(0);
            }

            // Boss bouncing logic (unchanged)
            if (this.boss.body.blocked.right) {
                this.boss.setVelocityX(-BOSS_SPEED);
            } else if (this.boss.body.blocked.left) {
                this.boss.setVelocityX(BOSS_SPEED);
            }
            
            // ✨ NEW: Recycling projectiles that go off-screen! ✨
            this.projectiles.children.iterate(laser => {
                if (laser && laser.y > GAME_HEIGHT) {
                    // If a laser goes off the bottom, we "kill" it by hiding
                    // and deactivating it, which puts it back in the box to be reused!
                    laser.setActive(false);
                    laser.setVisible(false);
                }
            });
        }

        return () => {
            gameRef.current.destroy(true);
        };

    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
