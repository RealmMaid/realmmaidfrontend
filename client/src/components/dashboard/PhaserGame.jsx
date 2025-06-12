import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
// --- PHASER SCENE DEFINITION ---
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    init() {
        console.log("Phaser: Initializing game state...");
        this.gameState = {
            score: 0,
            // Let's give ourselves 5 points per second to see it working!
            pointsPerSecond: 5,
            currentBossIndex: 0,
            clicksOnCurrentBoss: 0,
        };
    }

    preload() {
        console.log("Phaser: Preloading assets...");
        this.load.image('oryx1', '/oryx.png');
        this.load.audio('oryx_hit', '/oryxhit.mp3');
    }

    create() {
        console.log("Phaser: Create method called!");
        
        const bossImage = this.add.image(400, 300, 'oryx1');

        bossImage.setInteractive({ useHandCursor: true });
        bossImage.on('pointerdown', () => {
            this.gameState.score += 1;
            this.gameState.clicksOnCurrentBoss += 1;
            this.scoreText.setText(`Fame: ${this.gameState.score}`);
            this.sound.play('oryx_hit', { volume: 0.5 });
            this.tweens.add({
                targets: bossImage,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 50,
                yoyo: true,
                ease: 'Power1'
            });
        });
        
        this.scoreText = this.add.text(50, 50, `Fame: ${this.gameState.score}`, { 
            font: '24px "Press Start 2P"',
            fill: '#ffffff' 
        });

        // ✨ --- NEW: Add a looping timer for DPS --- ✨
        // This tells Phaser to call our `applyDps` function every 1000ms (1 second).
        this.time.addEvent({
            delay: 1000,
            callback: this.applyDps,
            callbackScope: this,
            loop: true
        });
    }

    // ✨ --- NEW: The function that gets called by our timer --- ✨
    applyDps() {
        // We only apply DPS if it's greater than 0.
        if (this.gameState.pointsPerSecond <= 0) {
            return;
        }

        // Add the pointsPerSecond to the score
        this.gameState.score += this.gameState.pointsPerSecond;

        // Update the score text on the screen
        this.scoreText.setText(`Fame: ${this.gameState.score}`);
    }

    update(time, delta) {
        // The `update` loop still runs every frame, but our DPS logic
        // is now handled neatly by the timer event!
    }
}
