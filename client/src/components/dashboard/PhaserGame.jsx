import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BOSS_SPEED = 150;
const BOSS_INITIAL_HEALTH = 1000;
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
                    debug: false // Set to true to see hitboxes again!
                }
            },
            scene: {
                init: function () {
                    this.playerHealth = PLAYER_INITIAL_HEALTH;
                    this.bossHealth = BOSS_INITIAL_HEALTH;
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
            this.load.image('player-beamslash', '/beamslash.png');
        }

        function create() {
            // Player
            this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'player');
            this.player.setCollideWorldBounds(true).setScale(0.4);
            this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.8);
            
            // Keyboard
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

            // Boss
            this.boss = this.physics.add.sprite(100, 80, 'boss');
            this.boss.setCollideWorldBounds(true).setVelocityX(BOSS_SPEED);
            this.boss.body.setSize(this.boss.width * 0.8, this.boss.height * 0.7);

            // Projectiles
            this.bossProjectiles = this.physics.add.group({ defaultKey: 'boss-beamslash', maxSize: 30 });
            this.playerProjectiles = this.physics.add.group({ defaultKey: 'player-beamslash', maxSize: 10 });

            // Timers
            this.time.addEvent({
                delay: 1500,
                callback: () => {
                    if (this.player.active && this.boss.active) {
                        const laser = this.bossProjectiles.get(this.boss.x, this.boss.y + 60);
                        if (laser) {
                            laser.setActive(true).setVisible(true).setVelocity(0, PROJECTILE_SPEED);
                            laser.body.setSize(laser.width * 0.5, laser.height * 0.8);
                        }
                    }
                },
                loop: true
            });
            
            // UI Text
            this.healthText = this.add.text(10, 10, `Health: ${this.playerHealth}`, { fontSize: '24px', fill: '#ffffff' });
            this.bossHealthText = this.add.text(GAME_WIDTH - 10, 10, `Boss HP: ${this.bossHealth}`, { fontSize: '24px', fill: '#ffffff' }).setOrigin(1, 0);
            
            // ✨ UPDATED: Switched from a hard "collider" to a soft "overlap"! ✨
            this.physics.add.overlap(this.player, this.bossProjectiles, playerHit, null, this);
            
            // ✨ NEW: An overlap checker for your lasers hitting the boss! ✨
            this.physics.add.overlap(this.boss, this.playerProjectiles, bossHit, null, this);
        }
        
        function playerHit(player, laser) { /* ...unchanged... */ }

        // ✨ NEW: A function for when YOU hit the BOSS! ✨
        function bossHit(boss, laser) {
            // Remove the player's laser
            laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y);
            
            // Deal damage to the boss
            this.bossHealth -= PROJECTILE_DAMAGE;
            this.bossHealthText.setText(`Boss HP: ${this.bossHealth}`);

            // You can add a boss death sequence here later!
            if (this.bossHealth <= 0) {
                // For now, let's just make him disappear hehe
                boss.setActive(false).setVisible(false);
            }
        }

        function update() { /* ...unchanged... */ }

        return () => { gameRef.current.destroy(true); };
    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
