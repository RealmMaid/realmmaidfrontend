import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BOSS_SPEED = 150;
const PROJECTILE_SPEED = 400;
const PLAYER_INITIAL_HEALTH = 3;

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
                // We need to give our scene access to our variables!
                init: function () {
                    this.playerHealth = PLAYER_INITIAL_HEALTH;
                },
                preload: preload,
                create: create,
                update: update
            }
        };

        gameRef.current = new Phaser.Game(config);

        function preload() {
            this.load.image('player', '/wizard.png');
            this.load.image('boss', '/oryx.png');
            // Using the correct filename! Hehe.
            this.load.image('beamslash', '/beamslash.png');
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

            // Create projectile group
            this.projectiles = this.physics.add.group({
                defaultKey: 'beamslash',
                maxSize: 30
            });

            // Create a timer to shoot
            this.time.addEvent({
                delay: 1500,
                callback: () => {
                    const laser = this.projectiles.get(this.boss.x, this.boss.y + 60);
                    if (laser) {
                        laser.setActive(true).setVisible(true).setVelocityY(PROJECTILE_SPEED);
                    }
                },
                loop: true
            });
            
            // ✨ NEW: Display the player's health! ✨
            this.healthText = this.add.text(10, 10, 'Health: ❤️❤️❤️', { fontSize: '24px', fill: '#ffffff' });

            // ✨ NEW: The magic collision detector! ✨
            // This tells Phaser to watch the player and the projectiles,
            // and if they ever overlap, call the `playerHit` function!
            this.physics.add.collider(this.player, this.projectiles, playerHit, null, this);
        }
        
        // ✨ NEW: This function runs when the player gets hit! ✨
        function playerHit(player, laser) {
            // "Kill" the laser by deactivating it and hiding it.
            // This puts it back in the group to be recycled! So efficient!
            laser.setActive(false);
            laser.setVisible(false);

            // Subtract one from our health variable
            this.playerHealth -= 1;
            
            // Update the text on the screen
            this.healthText.setText('Health: ' + '❤️'.repeat(this.playerHealth));
            
            // Check for Game Over!
            if (this.playerHealth <= 0) {
                // If health is gone, pause the game!
                this.physics.pause();
                // Make the player all red to show they're out T_T
                player.setTint(0xff0000);
                // Display a "Game Over" message
                const gameOverText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'GAME OVER', { 
                    fontSize: '64px', fill: '#ff0000' 
                }).setOrigin(0.5);

                // Add a restart button
                const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'Click to Restart', {
                    fontSize: '32px', fill: '#ffffff'
                }).setOrigin(0.5).setInteractive();
                
                // When the restart text is clicked, we restart the whole scene!
                restartText.on('pointerdown', () => {
                    this.scene.restart();
                });
            }
        }


        function update() {
            // Player movement logic (unchanged)
            if (this.player.active) { // Only allow movement if the player is active
                if (this.cursors.left.isDown || this.keyA.isDown) {
                    this.player.setVelocityX(-300);
                } else if (this.cursors.right.isDown || this.keyD.isDown) {
                    this.player.setVelocityX(300);
                } else {
                    this.player.setVelocityX(0);
                }
            }
            
            // Boss bouncing logic (unchanged)
            if (this.boss.body.blocked.right) {
                this.boss.setVelocityX(-BOSS_SPEED);
            } else if (this.boss.body.blocked.left) {
                this.boss.setVelocityX(BOSS_SPEED);
            }
            
            // Projectile recycling logic (unchanged)
            this.projectiles.children.iterate(laser => {
                if (laser && laser.y > GAME_HEIGHT) {
                    laser.setActive(false).setVisible(false);
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
