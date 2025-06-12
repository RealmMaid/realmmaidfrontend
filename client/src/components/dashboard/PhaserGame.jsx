import EventBus from '../../EventBus';
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
            pointsPerSecond: 5,
            currentBossIndex: 0,
            clicksOnCurrentBoss: 0,
            // ✨ NEW: Add state needed for damage calculation
            upgradesOwned: {},
            equippedWeapon: 'default', 
        };
    }

    preload() {
        this.load.image('oryx1', '/oryx.png');
        this.load.audio('oryx_hit', '/oryxhit.mp3');
    }

    create() {
        const bossImage = this.add.image(400, 300, 'oryx1');
        bossImage.setInteractive({ useHandCursor: true });

        bossImage.on('pointerdown', (pointer) => {
            // ✨ NEW: Expanded click logic ✨

            // 1. Calculate damage based on state
            const { minDamage, maxDamage } = this.calculateDamageRange();
            let damageDealt = Phaser.Math.Between(minDamage, maxDamage);

            // 2. Apply weapon effects
            switch (this.gameState.equippedWeapon) {
                case 'executioners_axe':
                    if (Math.random() < 0.10) { // 10% chance for a critical hit
                        damageDealt *= 10;
                        this.showFloatingText(pointer.x, pointer.y, `CRITICAL! ${damageDealt.toLocaleString()}`, '#ff3366', 32);
                    }
                    break;
                // We can add other weapon cases here later
            }
            
            // For now, fame earned is equal to damage dealt
            const fameEarned = damageDealt;

            // 3. Update the game state
            this.gameState.score += fameEarned;
            this.gameState.clicksOnCurrentBoss += damageDealt;

            // 4. Emit events to update the React UI
            EventBus.emit('scoreUpdated', this.gameState.score);
            // We can add a 'bossHealthUpdated' event later

            // 5. Show visual and audio feedback
            if (!this.tweens.isTweening(bossImage)) { // Prevent overlapping tweens
                this.tweens.add({
                    targets: bossImage, scale: 0.9, duration: 50, yoyo: true, ease: 'Power1'
                });
            }
            this.sound.play('oryx_hit', { volume: 0.5 });
            
            // Show normal floating damage text if it wasn't a critical hit
            if (this.gameState.equippedWeapon !== 'executioners_axe' || damageDealt <= maxDamage) {
                 this.showFloatingText(pointer.x, pointer.y, damageDealt.toLocaleString(), '#ffffff');
            }
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
    
    // ✨ NEW: A reusable function for calculating click damage ✨
    calculateDamageRange() {
        let minDamage = 1;
        let maxDamage = 5; // Start with a base range

        // Later, we will add logic here to check `this.gameState.upgradesOwned`
        // and `this.gameState.equippedWeapon` to modify the damage, just
        // like in your original `calculateDamageRange` function.

        return { minDamage, maxDamage };
    }

    // ✨ NEW: A reusable function for creating floating combat text ✨
    showFloatingText(x, y, message, color = '#ffffff', fontSize = 24) {
        const text = this.add.text(x, y, message, {
            font: `bold ${fontSize}px "Press Start 2P"`,
            fill: color,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Add a tween to make the text float up and fade out
        this.tweens.add({
            targets: text,
            y: y - 100,
            alpha: 0,
            duration: 1500,
            ease: 'Power1',
            onComplete: () => {
                text.destroy(); // Clean up the text object after the animation
            }
        });
    }

    update() { /* ... */ }
}
