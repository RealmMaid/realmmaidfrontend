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
                    gravity: { y: 0 },
                    // ✨ NEW: Let's turn on debug mode to see our new hitboxes! ✨
                    debug: true 
                }
            },
            scene: {
                init: function () { this.playerHealth = PLAYER_INITIAL_HEALTH; },
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
            this.load.image('player-beamslash', '/player-beamslash.png');
        }

        function create() {
            // Create player
            this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'player');
            this.player.setCollideWorldBounds(true).setScale(0.4);
            // ✨ NEW: Set a smaller, more forgiving hitbox for the player! ✨
            this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.8);

            // Create keyboard listeners
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

            // Create boss
            this.boss = this.physics.add.sprite(100, 80, 'boss');
            this.boss.setCollideWorldBounds(true).setVelocityX(BOSS_SPEED);
            // ✨ NEW: A smaller hitbox for the boss, too! ✨
            this.boss.body.setSize(this.boss.width * 0.8, this.boss.height * 0.7);

            // Create projectile groups
            this.bossProjectiles = this.physics.add.group({ defaultKey: 'beamslash', maxSize: 30 });
            this.playerProjectiles = this.physics.add.group({ defaultKey: 'player-beamslash', maxSize: 10 });

            // Boss shooting timer
            this.time.addEvent({
                delay: 1500,
                callback: () => {
                    if (this.player.active) {
                        const laser = this.bossProjectiles.get(this.boss.x, this.boss.y + 60);
                        if (laser) {
                            laser.setActive(true).setVisible(true).setVelocity(0, PROJECTILE_SPEED);
                            // ✨ NEW: Set a smaller hitbox for the boss's lasers! ✨
                            laser.body.setSize(laser.width * 0.5, laser.height * 0.8);
                        }
                    }
                },
                loop: true
            });
            
            this.healthText = this.add.text(10, 10, `Health: ${this.playerHealth}`, { fontSize: '24px', fill: '#ffffff' });
            this.physics.add.collider(this.player, this.bossProjectiles, playerHit, null, this);
        }
        
        function playerHit(player, laser) { /* ...unchanged... */ }

        function update() {
            if (this.player.active) {
                // Player movement logic (unchanged)
                if (this.cursors.left.isDown || this.keyA.isDown) { this.player.setVelocityX(-300); }
                else if (this.cursors.right.isDown || this.keyD.isDown) { this.player.setVelocityX(300); }
                else { this.player.setVelocityX(0); }

                // Player shooting logic (with hitbox setting!)
                if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
                    const laser = this.playerProjectiles.get(this.player.x, this.player.y - 40);
                    if (laser) {
                        laser.setActive(true).setVisible(true).setVelocityY(PLAYER_PROJECTILE_SPEED);
                        // ✨ NEW: Player's lasers need a smaller hitbox too! ✨
                        laser.body.setSize(laser.width * 0.5, laser.height * 0.8);
                    }
                }
            }
            // Boss movement logic (unchanged)
            if (this.boss.body.blocked.right) { this.boss.setVelocityX(-BOSS_SPEED); }
            else if (this.boss.body.blocked.left) { this.boss.setVelocityX(BOSS_SPEED); }
            
            // ✨ UPDATED: Recycling projectiles a little earlier to prevent invisible hits! ✨
            this.bossProjectiles.children.iterate(laser => {
                if (laser && laser.y > GAME_HEIGHT) { laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y); }
            });
            this.playerProjectiles.children.iterate(laser => {
                if (laser && laser.y < 0) { laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y); }
            });
        }
        // ... rest of the component is unchanged
    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
