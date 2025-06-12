import Phaser from 'phaser';
import { bosses } from '../../../data/bosses';

export class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });

        this.store = null;
        this.bossSprite = null;
        this.gameTick = 0;
    }

    init(data) {
        this.store = data.store;
    }

    preload() {
        bosses.forEach(boss => {
            boss.images.forEach((img, index) => {
                this.load.image(`${boss.id}_${index}`, img);
            });
        });
        this.load.audio('oryx_hit', '/oryxhit.mp3');
    }

    create() {
        const { currentBossIndex } = this.store.getState();
        const currentBoss = bosses[currentBossIndex];
        
        this.bossSprite = this.add.sprite(250, 200, `${currentBoss.id}_0`).setInteractive({ useHandCursor: true });
        this.bossSprite.on('pointerdown', this.handleBossClick, this);

        // We NO LONGER call this.store.subscribe() here. It has been removed.
    }
    
    // The update loop is now solely responsible for everything.
    update(time, delta) {
        // Get the current state on every single frame.
        const state = this.store.getState();

        // --- Handle Per-Second Game Logic ---
        // This part is unchanged.
        if (state.gamePhase === 'clicking' && !state.isHealing) {
            this.gameTick += delta;
            if (this.gameTick >= 1000) {
                this.gameTick -= 1000;
                state.applyDps();
                state.checkBossDefeat();
            }
        }

        // --- Handle Visual Updates on Every Frame ---
        // We now call our visual update logic directly from here.
        this.updateBossVisuals(state);
    }

    handleBossClick(pointer) {
        const { gamePhase, isHealing, isInvulnerable, calculateDamageRange, applyClick, playSound } = this.store.getState();
        
        if (gamePhase !== 'clicking' || isHealing || isInvulnerable) return;

        playSound('oryx_hit', 0.5);

        const { minDamage, maxDamage } = calculateDamageRange();
        const damageDealt = Phaser.Math.Between(minDamage, maxDamage);
        const fameEarned = damageDealt;

        applyClick(damageDealt, fameEarned);

        this.showFloatingText(`-${damageDealt.toLocaleString()}`, pointer.x, pointer.y);
        this.cameras.main.shake(100, 0.005);
    }
    
    // This new function contains the logic that used to be in the subscribe listener.
    updateBossVisuals(state) {
        const currentBoss = bosses[state.currentBossIndex];
        if (!currentBoss || !this.bossSprite.scene) return; // Add a guard to ensure scene is active

        // Update the main boss sprite texture if the boss has changed
        const currentTexture = `${currentBoss.id}_0`;
        if (this.bossSprite.texture.key !== currentTexture) {
            this.bossSprite.setTexture(currentTexture);
        }

        // Enable or disable clicking based on the game state
        this.bossSprite.input.enabled = (state.gamePhase === 'clicking' && !state.isHealing && !state.isInvulnerable);
    }
    
    showFloatingText(message, x, y, color = '#ffffff', fontSize = '20px') {
        let text = this.add.text(x, y, message, {
            fontFamily: 'Arial, "Press Start 2P"',
            fontSize: fontSize,
            color: color,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 75,
            alpha: 0,
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                text.destroy();
            }
        });
    }
}
