import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import EventBus from '../../EventBus';

// Data imports needed for game logic
import { bosses } from '../../data/bosses';
import { classUpgrades } from '../../data/classUpgrades';
import { weapons } from '../../data/weapons';
import { abilities } from '../../data/abilities';

// --- This is the new heart of your game ---
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    // `init` is called when the scene starts, receiving data from the component.
    // For now, we'll use a default, but later React can pass in the player's class.
    init(data) {
        this.playerClass = data.playerClass || 'Warrior'; // Default to Warrior for testing

        // This is our new "single source of truth" for all game state.
        this.gameState = {
            score: 0,
            pointsPerSecond: 0,
            currentBossIndex: 0,
            clicksOnCurrentBoss: 0,
            upgradesOwned: {},
            equippedWeapon: 'default',
            // ... add other state properties from your original game as needed
        };

        // Timer for the 1-second game tick
        this.gameTick = 0;
    }

    // `preload` loads all our assets like images and sounds.
    preload() {
        bosses.forEach(boss => {
            this.load.image(boss.id, boss.images[0]);
        });
        this.load.audio('oryx_hit', '/oryxhit.mp3');
        this.load.audio('oryx_death', '/oryxdeath.mp3');
    }

    // `create` sets up the scene when it's ready.
    create() {
        // --- Game Objects ---
        this.bossImage = this.add.image(400, 300, bosses[this.gameState.currentBossIndex].id);
        this.bossImage.setInteractive({ useHandCursor: true });
        
        // --- Event Listeners ---
        // Listen for clicks on the boss
        this.bossImage.on('pointerdown', this.handleBossClick, this);

        // Listen for events coming FROM the React UI
        EventBus.on('buyUpgrade', this.handleBuyUpgrade, this);
    }

    // `update` is the master game loop, called on every frame.
    update(time, delta) {
        // Accumulate delta time to create a 1-second tick
        this.gameTick += delta;
        if (this.gameTick > 1000) {
            this.gameTick -= 1000;

            // --- Logic to run every second ---
            this.applyDps();
            // We can add other per-second logic here (poison, healing checks, etc.)
        }
    }

    // === GAME LOGIC METHODS (Transplanted from your React component) ===

    handleBossClick(pointer) {
        // --- From your original handleGemClick function ---
        const { minDamage, maxDamage } = this.calculateDamageRange();
        let damageDealt = Phaser.Math.Between(minDamage, maxDamage);
        let fameEarned = damageDealt;

        // Apply weapon effects
        if (this.gameState.equippedWeapon === 'executioners_axe' && Math.random() < 0.10) {
            damageDealt *= 10;
            this.showFloatingText(pointer.x, pointer.y, `CRIT! ${damageDealt.toLocaleString()}`, '#ff3366', 32);
        } else {
            this.showFloatingText(pointer.x, pointer.y, damageDealt.toLocaleString(), '#ffffff');
        }

        if (this.gameState.equippedWeapon === 'golden_rapier') {
            fameEarned *= 1.25;
        }

        // Update state
        this.gameState.score += fameEarned;
        this.gameState.clicksOnCurrentBoss += damageDealt;

        // Emit events to update React UI
        EventBus.emit('scoreUpdated', this.gameState.score);
        EventBus.emit('bossHealthUpdated', {
            current: this.gameState.clicksOnCurrentBoss,
            max: bosses[this.gameState.currentBossIndex].clickThreshold
        });

        // Play feedback
        this.sound.play('oryx_hit', { volume: 0.5 });
        this.tweens.add({ targets: this.bossImage, scale: 0.9, duration: 50, yoyo: true, ease: 'Power1' });
        
        // Check for boss defeat
        this.checkBossDefeat();
    }

    applyDps() {
        if (this.gameState.pointsPerSecond <= 0) return;
        this.gameState.score += this.gameState.pointsPerSecond;
        EventBus.emit('scoreUpdated', this.gameState.score);
    }
    
    checkBossDefeat() {
        const currentBoss = bosses[this.gameState.currentBossIndex];
        if (this.gameState.clicksOnCurrentBoss >= currentBoss.clickThreshold) {
            this.sound.play('oryx_death');
            this.gameState.currentBossIndex++;
            this.gameState.clicksOnCurrentBoss = 0;

            const newBoss = bosses[this.gameState.currentBossIndex];
            if (newBoss) {
                this.bossImage.setTexture(newBoss.id); // Change the boss image
                EventBus.emit('bossHealthUpdated', { current: 0, max: newBoss.clickThreshold });
            } else {
                // Game over!
                this.bossImage.setVisible(false);
                this.add.text(400, 300, 'YOU WIN!', { font: '64px "Press Start 2P"', fill: '#ffd700' }).setOrigin(0.5);
            }
        }
    }

    calculateDamageRange() {
        let minDamage = 1;
        let maxDamage = 5;

        const bossStage = `stage${Math.min(this.gameState.currentBossIndex + 1, 3)}`;
        const availableUpgrades = classUpgrades[bossStage]?.[this.playerClass] || [];

        availableUpgrades.forEach(upgrade => {
            const owned = this.gameState.upgradesOwned[upgrade.id] || 0;
            if (owned > 0) {
                if (upgrade.type === 'perClick') {
                    minDamage += (upgrade.minBonus || 0) * owned;
                    maxDamage += (upgrade.maxBonus || 0) * owned;
                } else if (upgrade.clickBonus) {
                    minDamage += upgrade.clickBonus * owned;
                    maxDamage += upgrade.clickBonus * owned;
                }
            }
        });
        
        return { minDamage, maxDamage };
    }
    
    handleBuyUpgrade(upgradeId) {
        const bossStage = `stage${Math.min(this.gameState.currentBossIndex + 1, 3)}`;
        const availableUpgrades = classUpgrades[bossStage]?.[this.playerClass] || [];
        const upgrade = availableUpgrades.find(u => u.id === upgradeId);
        
        if (!upgrade) return;

        const owned = this.gameState.upgradesOwned[upgrade.id] || 0;
        const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));

        if (this.gameState.score >= cost) {
            this.gameState.score -= cost;
            this.gameState.upgradesOwned[upgrade.id] = owned + 1;
            
            if (upgrade.type === 'perSecond') {
                this.gameState.pointsPerSecond += upgrade.value;
            }

            // Tell React the state has changed
            EventBus.emit('scoreUpdated', this.gameState.score);
            EventBus.emit('upgradePurchased', upgradeId);
        }
    }

    showFloatingText(x, y, message, color = '#ffffff', fontSize = 24) {
        let text = this.add.text(x, y, message, {
            font: `bold ${fontSize}px "Press Start 2P"`, fill: color, stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text, y: y - 100, alpha: 0, duration: 1500, ease: 'Power1', onComplete: () => text.destroy()
        });
    }
}


// --- This is the React component that will render our Phaser game ---
function PhaserGame() {
    const phaserRef = useRef(null);
    const gameInstanceRef = useRef(null);
    const playerClass = useGameStore(state => state.playerClass); // Get player class from store

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
            // Pass data to the scene
            gameInstanceRef.current.scene.start('MainScene', { playerClass: playerClass });
        }

        return () => {
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
        };
    }, [playerClass]); // Re-create the game if the playerClass changes (optional)

    return <div ref={phaserRef} id="phaser-container" />;
}

export default PhaserGame;
