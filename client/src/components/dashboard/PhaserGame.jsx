import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import EventBus from '../../EventBus';
// --- PHASER SCENE DEFINITION ---
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    init() {
        this.gameState = {
            score: 0,
            pointsPerSecond: 5,
            currentBossIndex: 0,
            clicksOnCurrentBoss: 0,
        };
    }

    preload() {
        this.load.image('oryx1', '/oryx.png');
        this.load.audio('oryx_hit', '/oryxhit.mp3');
    }

    create() {
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

        this.time.addEvent({
            delay: 1000,
            callback: this.applyDps,
            callbackScope: this,
            loop: true
        });
    }

    applyDps() {
        if (this.gameState.pointsPerSecond <= 0) return;
        this.gameState.score += this.gameState.pointsPerSecond;
        this.scoreText.setText(`Fame: ${this.gameState.score}`);
    }

    update(time, delta) {
        // The game loop
    }
}

// --- REACT COMPONENT DEFINITION ---
// Notice the `export` keyword is removed from this line...
function PhaserGame() {
    const phaserRef = useRef(null);
    const gameInstanceRef = useRef(null);

    useEffect(() => {
        if (!phaserRef.current) return;

        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: phaserRef.current,
            backgroundColor: '#1a0922',
            scene: [MainScene]
        };

        if (!gameInstanceRef.current) {
            gameInstanceRef.current = new Phaser.Game(config);
        }

        return () => {
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
        };
    }, []);

    return <div ref={phaserRef} id="phaser-container" />;
}

// ...and added here, making it the one and only default export.
// This resolves the "PhaserGame is not defined" error.
export default PhaserGame;
