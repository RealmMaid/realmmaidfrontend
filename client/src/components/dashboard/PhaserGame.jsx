import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// ✨ UPDATED: New constants for our HP system! ✨
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BOSS_SPEED = 150;
const PROJECTILE_SPEED = 400;
const PLAYER_INITIAL_HEALTH = 200;
const PROJECTILE_DAMAGE = 10;

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
                arcade: { gravity: { y: 0 } }
            },
            scene: {
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
            this.load.image('beamslash', '/beamslash.png');
        }

        function create() {
            this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'player');
            this.player.setCollideWorldBounds(true);
            this.player.setScale(0.4);
            // ✨ NEW: Let's add a property to track invincibility! ✨
            this.player.isInvincible = false;
            
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

            this.boss = this.physics.add.sprite(100, 80, 'boss');
            this.boss.setCollideWorldBounds(true);
            this.boss.setVelocityX(BOSS_SPEED);

            this.projectiles = this.physics.add.group({ defaultKey: 'beamslash', maxSize: 30 });

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
            
            // ✨ UPDATED: Display health as a number! ✨
            this.healthText = this.add.text(10, 10, `Health: ${this.playerHealth}`, { fontSize: '24px', fill: '#ffffff' });

            this.physics.add.collider(this.player, this.projectiles, playerHit, null, this);
        }
        
        // ✨ UPDATED: The playerHit function now has invincibility logic! ✨
        function playerHit(player, laser) {
            // If the player is invincible, do nothing! Hehe.
            if (player.isInvincible) {
                return;
            }

            // If not invincible, let's take damage!
            laser.setActive(false).setVisible(false);
            this.playerHealth -= PROJECTILE_DAMAGE;
            this.healthText.setText('Health: ' + this.playerHealth);
            
            // Check for Game Over
            if (this.playerHealth <= 0) {
                this.physics.pause();
                player.setTint(0xff0000);
                this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'GAME OVER', { 
                    fontSize: '64px', fill: '#ff0000' 
                }).setOrigin(0.5);

                const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'Click to Restart', {
                    fontSize: '32px', fill: '#ffffff'
                }).setOrigin(0.5).setInteractive();
                
                restartText.on('pointerdown', () => {
                    this.scene.restart();
                });
            } else {
                // If not game over, start "sparkle time"!
                player.isInvincible = true;
                // This makes the player flash for 1 second! So cool!
                this.tweens.add({
                    targets: player,
                    alpha: 0.5,
                    duration: 100,
                    ease: 'Linear',
                    yoyo: true,
                    repeat: 5, // 5 flashes for a total of 1 second
                    onComplete: () => {
                        player.isInvincible = false;
                        player.alpha = 1; // Make sure they are fully visible at the end
                    }
                });
            }
        }

        function update() { /* ... unchanged ... */ }

        return () => { gameRef.current.destroy(true); };
    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
