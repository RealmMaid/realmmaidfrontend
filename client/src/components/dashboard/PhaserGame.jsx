import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BOSS_SPEED = 150;
const PROJECTILE_SPEED = 400;
const PLAYER_INITIAL_HEALTH = 200;
const PROJECTILE_DAMAGE = 10;
const PLAYER_PROJECTILE_SPEED = -600;

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
                    gravity: { y: 0 }
                }
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
            this.load.image('boss-beamslash', '/beamslash.png');
            this.load.image('player-beamslash', '/player-beamslash.png');
        }

        function create() {
            this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'player');
            this.player.setCollideWorldBounds(true).setScale(0.4);
            
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

            this.boss = this.physics.add.sprite(100, 80, 'boss');
            this.boss.setCollideWorldBounds(true).setVelocityX(BOSS_SPEED);

            this.bossProjectiles = this.physics.add.group({ defaultKey: 'boss-beamslash', maxSize: 30 });
            this.playerProjectiles = this.physics.add.group({ defaultKey: 'player-beamslash', maxSize: 10 });

            this.time.addEvent({
                delay: 1500,
                callback: () => {
                    if (this.player.active) {
                        const laser = this.bossProjectiles.get(this.boss.x, this.boss.y + 60);
                        if (laser) {
                            laser.setActive(true).setVisible(true).setVelocity(0, PROJECTILE_SPEED);
                        }
                    }
                },
                loop: true
            });
            
            this.healthText = this.add.text(10, 10, `Health: ${this.playerHealth}`, { fontSize: '24px', fill: '#ffffff' });
            
            // The collider now calls our new, robust playerHit function!
            this.physics.add.collider(this.player, this.bossProjectiles, playerHit, null, this);
        }
        
        // ✨ UPDATED: The new and improved playerHit function! ✨
        function playerHit(player, laser) {
            // First, reset the laser that hit us so it doesn't cause more trouble.
            laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y);

            // Turn off the player's physics body to make them a ghost!
            player.body.enable = false;

            // Deal damage
            this.playerHealth -= PROJECTILE_DAMAGE;
            this.healthText.setText('Health: ' + Math.max(0, this.playerHealth));
            
            // Check for Game Over
            if (this.playerHealth <= 0) {
                this.physics.pause();
                player.setTint(0xff0000);
                this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'GAME OVER', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5);
                const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'Click to Restart', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5).setInteractive();
                restartText.on('pointerdown', () => { this.scene.restart(); });
            } else {
                // If not game over, start flashing!
                this.tweens.add({
                    targets: player,
                    alpha: 0.5,
                    duration: 200, // A longer flash
                    ease: 'Linear',
                    yoyo: true,
                    repeat: 2, // Flash 3 times over ~1.2 seconds
                    onComplete: () => {
                        // When the flashing is done, make the player solid and turn their physics back on!
                        player.setAlpha(1);
                        player.body.enable = true;
                    }
                });
            }
        }

        function update() {
            // Player and boss movement is unchanged, but now respects player.active
            if (this.player.active) {
                if (this.cursors.left.isDown || this.keyA.isDown) { this.player.setVelocityX(-300); }
                else if (this.cursors.right.isDown || this.keyD.isDown) { this.player.setVelocityX(300); }
                else { this.player.setVelocityX(0); }
                if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
                    const laser = this.playerProjectiles.get(this.player.x, this.player.y - 40);
                    if (laser) { laser.setActive(true).setVisible(true).setVelocityY(PLAYER_PROJECTILE_SPEED); }
                }
            }
            if (this.boss.body.blocked.right) { this.boss.setVelocityX(-BOSS_SPEED); }
            else if (this.boss.body.blocked.left) { this.boss.setVelocityX(BOSS_SPEED); }
            this.bossProjectiles.children.iterate(laser => { if (laser && laser.y > GAME_HEIGHT) { laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y); }});
            this.playerProjectiles.children.iterate(laser => { if (laser && laser.y < 0) { laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y); }});
        }

        return () => { gameRef.current.destroy(true); };
    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
