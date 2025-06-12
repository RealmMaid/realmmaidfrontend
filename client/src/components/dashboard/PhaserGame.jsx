import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import EventBus from '../../EventBus';

// --- This is the core of our game's logic ---
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    // `init` is called when the scene starts. It sets up our initial state.
    init() {
        this.gameState = {
            score: 0,
        };
    }

    // `preload` loads all our assets like images and sounds.
    preload() {
        this.load.image('oryx1', '/oryx.png');
        this.load.audio('oryx_hit', '/oryxhit.mp3');
    }

    // `create` sets up the scene when it's ready.
    create() {
        const bossImage = this.add.image(400, 300, 'oryx1');

        // Make the boss sprite interactive
        bossImage.setInteractive({ useHandCursor: true });

        // Set up the click event listener
        bossImage.on('pointerdown', () => {
            // 1. Update the internal game state
            this.gameState.score += 1;
            
            // 2. Emit an event to tell React about the change
            EventBus.emit('scoreUpdated', this.gameState.score);
            
            // 3. Play feedback
            this.sound.play('oryx_hit', { volume: 0.5 });
            this.tweens.add({
                targets: bossImage,
                scale: 0.9,
                duration: 50,
                yoyo: true,
                ease: 'Power1'
            });
        });
    }
}


// --- This is the React component that will render our Phaser game ---
function PhaserGame() {
    const phaserRef = useRef(null);
    const gameInstanceRef = useRef(null);

    // This hook creates and cleans up the Phaser game instance
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

        // Create the game instance only once
        if (!gameInstanceRef.current) {
            gameInstanceRef.current = new Phaser.Game(config);
        }

        // Cleanup function to destroy the game when the component unmounts
        return () => {
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
        };
    }, []);

    // This div is the container where Phaser will inject its canvas
    return <div ref={phaserRef} id="phaser-container" />;
}

export default PhaserGame;import React, { useEffect, useRef } from 'react';
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
