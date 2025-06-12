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
            upgradesOwned: {},
            equippedWeapon: 'default',
        };
    }

    preload() {
        this.load.image('oryx1', '/oryx.png');
        this.load.audio('oryx_hit', '/oryxhit.mp3');
    }

    create() {
        // ✨ DEBUGGING LOG ADDED HERE ✨
        console.log(`%cPhaser Scene is using EventBus with ID: ${EventBus.id}`, 'font-weight: bold; color: #00ff00;');

        const bossImage = this.add.image(400, 300, 'oryx1');
        bossImage.setInteractive({ useHandCursor: true });

        bossImage.on('pointerdown', (pointer) => {
            const { minDamage, maxDamage } = this.calculateDamageRange();
            let damageDealt = Phaser.Math.Between(minDamage, maxDamage);
            const fameEarned = damageDealt;
            this.gameState.score += fameEarned;
            
            EventBus.emit('scoreUpdated', this.gameState.score);
            
            if (!this.tweens.isTweening(bossImage)) {
                this.tweens.add({ targets: bossImage, scale: 0.9, duration: 50, yoyo: true, ease: 'Power1' });
            }
            this.sound.play('oryx_hit', { volume: 0.5 });
            this.showFloatingText(pointer.x, pointer.y, damageDealt.toLocaleString(), '#ffffff');
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
        EventBus.emit('scoreUpdated', this.gameState.score);
    }
    
    calculateDamageRange() {
        let minDamage = 1;
        let maxDamage = 5;
        return { minDamage, maxDamage };
    }

    showFloatingText(x, y, message, color = '#ffffff', fontSize = 24) {
        let text = this.add.text(x, y, message, {
            font: `bold ${fontSize}px "Press Start 2P"`,
            fill: color,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 100,
            alpha: 0,
            duration: 1500,
            ease: 'Power1',
            onComplete: () => {
                text.destroy();
            }
        });
    }

    update() {}
}


// --- REACT COMPONENT DEFINITION ---
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

export default PhaserGame;
