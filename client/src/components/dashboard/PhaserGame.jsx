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
const BOSS_PHASE_HEAL_AMOUNT = 250;

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
                    this.bossPhase = 1;
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
            this.load.image('stun-shot', '/stun-shot.png');
            this.load.audio('boss-hit', '/oryxhit.mp3');
            this.load.audio('boss-death', '/oryxdeath.mp3');
            this.load.audio('player-death', '/wizarddeath.mp3');
        }

        function create() {
            this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'player');
            this.player.setCollideWorldBounds(true).setScale(0.4);
            this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.8);
            this.player.isStunned = false;
            
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

            this.boss = this.physics.add.sprite(100, 80, 'boss');
            this.boss.setCollideWorldBounds(true).setVelocityX(BOSS_SPEED);
            this.boss.body.setSize(this.boss.width * 0.8, this.boss.height * 0.7);
            this.boss.isInvincible = false;

            this.bossProjectiles = this.physics.add.group({ defaultKey: 'boss-beamslash', maxSize: 50 });
            this.playerProjectiles = this.physics.add.group({ defaultKey: 'player-beamslash', maxSize: 10 });
            this.stunProjectiles = this.physics.add.group({ defaultKey: 'stun-shot', maxSize: 5 });
            
            this.healthText = this.add.text(10, 10, `Health: ${this.playerHealth}`, { fontSize: '24px', fill: '#ffffff' });
            this.bossHealthText = this.add.text(GAME_WIDTH - 10, 10, `Boss HP: ${this.bossHealth}`, { fontSize: '24px', fill: '#ffffff' }).setOrigin(1, 0);

            this.shotCounter = 0;
            this.bossShootingTimer = this.time.addEvent({
                delay: 1500,
                callback: () => {
                    if (this.boss.active) {
                        this.shotCounter++;
                        const isStunTurn = this.shotCounter % 7 === 0;
                        const isShotgunTurn = (this.bossPhase === 1 && this.shotCounter % 4 === 0) || (this.bossPhase === 2 && this.shotCounter % 2 === 0);

                        if (isStunTurn) { shootStunShot.call(this); }
                        else if (isShotgunTurn) { shootShotgunBlast.call(this); }
                        else { shootSingleLaser.call(this); }
                    }
                },
                loop: true
            });

            this.physics.add.overlap(this.player, this.bossProjectiles, playerHit, null, this);
            this.physics.add.overlap(this.boss, this.playerProjectiles, bossHit, null, this);
            this.physics.add.overlap(this.player, this.stunProjectiles, playerStunned, null, this);
        }
        
        function shootSingleLaser() { /* ... function is unchanged ... */ }
        function shootShotgunBlast() { /* ... function is unchanged ... */ }
        function shootStunShot() { /* ... function is unchanged ... */ }
        function playerHit(player, laser) { /* ... function is unchanged ... */ }

        function bossHit(boss, laser) {
            if (boss.isInvincible) {
                laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y);
                return;
            }

            laser.setActive(false).setVisible(false).body.reset(laser.x, laser.y);
            this.bossHealth -= PROJECTILE_DAMAGE;

            if (this.bossHealth <= BOSS_INITIAL_HEALTH / 2 && this.bossPhase === 1) {
                this.bossPhase = 2;
                boss.isInvincible = true;
                this.bossShootingTimer.remove();

                this.tweens.add({ targets: boss, tint: 0xff0000, duration: 100, ease: 'Linear', yoyo: true, repeat: 20 });

                let healCounter = 0;
                const totalHealTicks = 10;
                const healPerTick = BOSS_PHASE_HEAL_AMOUNT / totalHealTicks;
                
                const rageTimer = this.time.addEvent({
                    delay: 400,
                    repeat: totalHealTicks - 1,
                    callback: () => {
                        this.bossHealth = Math.min(BOSS_INITIAL_HEALTH, this.bossHealth + healPerTick);
                        this.bossHealthText.setText(`Boss HP: ${Math.floor(this.bossHealth)}`);
                        shootShotgunBlast.call(this);
                    },
                });

                this.time.delayedCall(rageTimer.getOverallRemaining(), () => {
                    boss.isInvincible = false;
                    boss.clearTint();
                    this.bossShootingTimer = this.time.addEvent({
                        delay: 1500, // Restart with normal timer
                        callback: () => {
                            if (this.boss.active) {
                                this.shotCounter++;
                                const isShotgunTurn = (this.bossPhase === 2 && this.shotCounter % 2 === 0);
                                if (isShotgunTurn) { shootShotgunBlast.call(this); } 
                                else { shootSingleLaser.call(this); }
                            }
                        },
                        loop: true
                    });
                });
            }

            this.bossHealthText.setText(`Boss HP: ${Math.max(0, this.bossHealth)}`);

            if (this.bossHealth <= 0) {
                this.sound.play('boss-death');
                boss.setActive(false).setVisible(false);
            } else {
                this.sound.play('boss-hit');
            }
        }

        function playerStunned(player, stunShot) {
            if (player.isInvincible) { return; }
            stunShot.setActive(false).setVisible(false).body.reset(stunShot.x, stunShot.y);
            player.isStunned = true;
            player.setTint(0xffff00);
            this.time.delayedCall(2000, () => {
                player.isStunned = false;
                player.clearTint();
            });
        }

        function update() {
            if (this.player.active) {
                if (!this.player.isStunned) {
                    if (this.cursors.left.isDown || this.keyA.isDown) { this.player.setVelocityX(-300); }
                    else if (this.cursors.right.isDown || this.keyD.isDown) { this.player.setVelocityX(300); }
                    else { this.player.setVelocityX(0); }
                } else {
                    this.player.setVelocityX(0); // Make sure player stops if stunned
                }

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
            this.stunProjectiles.children.iterate(shot => { if (shot && shot.y > GAME_HEIGHT) { shot.setActive(false).setVisible(false).body.reset(shot.x, shot.y); }});
        }

        return () => { gameRef.current.destroy(true); };
    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
