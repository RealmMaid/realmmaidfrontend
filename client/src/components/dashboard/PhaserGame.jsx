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
                    debug: false
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
            this.load.image('player-beamslash', '/player-beamslash.png');
        }

        function create() {
            this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'player');
            this.player.setCollideWorldBounds(true).setScale(0.4);
            this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.8);
            
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

            this.boss = this.physics.add.sprite(100, 80, 'boss');
            this.boss.setCollideWorldBounds(true).setVelocityX(BOSS_SPEED);
            this.boss.body.setSize(this.boss.width * 0.8, this.boss.height * 0.7);

            this.bossProjectiles = this.physics.add.group({ defaultKey: 'boss-beamslash', maxSize: 30 });
            this.playerProjectiles = this.physics.add.group({ defaultKey: 'player-beamslash', maxSize: 10 });

            this.time.addEvent({
                delay: 1500,
                callback: () => {
                    if (this.boss.active) {
                        const laser = this.bossProjectiles.get(this.boss.x, this.boss.y + 60);
                        if (laser) {
                            laser.setActive(true).setVisible(true).setVelocity(0, PROJECTILE_SPEED);
                            laser.body.setSize(laser.width * 0.5, laser.height * 0.8);
                        }
                    }
                },
                loop: true
            });
            
            this.healthText = this.add.text(10, 10, `Health: ${this.playerHealth}`, { fontSize: '24px', fill: '#ffffff' });
            this.bossHealthText = this.add.text(GAME_WIDTH - 10, 10, `Boss HP: ${this.bossHealth}`, { fontSize: '24px', fill: '#ffffff' }).setOrigin(1, 0);
            
            // Use OVERLAP, not collider, to prevent pushing!
            this.physics.add.overlap(this.player, this.bossProjectiles, playerHit, null, this);
            this.physics.add.overlap(this.boss, this.playerProjectiles, bossHit, null, this);
        }
        
        function playerHit(player, laser) {
            // Immediately disable the player's physics body to become a ghost
            player.body.enable = false;
            
            laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y);

            this.playerHealth -= PROJECTILE_DAMAGE;
            this.healthText.setText('Health: ' + Math.max(0, this.playerHealth));
            
            if (this.playerHealth <= 0) {
                this.physics.pause();
                player.setTint(0xff0000);
                this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'GAME OVER', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5);
                const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'Click to Restart', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5).setInteractive();
                restartText.on('pointerdown', () => { this.scene.restart(); });
            } else {
                // Flash to show invincibility, then re-enable the body on completion
                this.tweens.add({
                    targets: player,
                    alpha: 0.5,
                    duration: 200,
                    ease: 'Linear',
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => {
                        player.setAlpha(1);
                        player.body.enable = true; // Become solid again!
                    }
                });
            }
        }

        function bossHit(boss, laser) {
            laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y);
            this.bossHealth -= PROJECTILE_DAMAGE;
            this.bossHealthText.setText(`Boss HP: ${Math.max(0, this.bossHealth)}`);

            if (this.bossHealth <= 0) {
                boss.setActive(false).setVisible(false);
                // We'll add a "You Win!" screen later!
            }
        }

        function update() {
            // This is the full, correct update loop!
            if (this.player.active) {
                if (this.cursors.left.isDown || this.keyA.isDown) { this.player.setVelocityX(-300); }
                else if (this.cursors.right.isDown || this.keyD.isDown) { this.player.setVelocityX(300); }
                else { this.player.setVelocityX(0); }

                if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
                    const laser = this.playerProjectiles.get(this.player.x, this.player.y - 40);
                    if (laser) {
                        laser.setActive(true).setVisible(true).setVelocityY(PLAYER_PROJECTILE_SPEED);
                        laser.body.setSize(laser.width * 0.5, laser.height * 0.8);
                    }
                }
            }

            if (this.boss.active) {
                if (this.boss.body.blocked.right) { this.boss.setVelocityX(-BOSS_SPEED); }
                else if (this.boss.body.blocked.left) { this.boss.setVelocityX(BOSS_SPEED); }
            }
            
            this.bossProjectiles.children.iterate(laser => { if (laser && laser.y > GAME_HEIGHT) { laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y); }});
            this.playerProjectiles.children.iterate(laser => { if (laser && laser.y < 0) { laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y); }});
        }

        return () => { gameRef.current.destroy(true); };
    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
