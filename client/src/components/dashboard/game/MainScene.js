import Phaser from 'phaser';
import { bosses } from '../../../data/bosses';

export class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });

        this.store = null;
        this.bossSprite = null;
        this.gameTick = 0; // A timer to accumulate delta time for our 1-second interval
    }

    // This method is called first, receiving the data object from scene.start().
    init(data) {
        this.store = data.store;
    }

    preload() {
        // Preload all the boss images so they are ready to be used.
        bosses.forEach(boss => {
            boss.images.forEach((img, index) => {
                // We create a unique key for each boss phase image.
                this.load.image(`${boss.id}_${index}`, img);
            });
        });

        // Preload any sounds Phaser will manage.
        this.load.audio('oryx_hit', '/oryxhit.mp3');
    }

    create() {
        // Get the initial state from the store to set up the scene.
        const { currentBossIndex } = this.store.getState();
        const currentBoss = bosses[currentBossIndex];
        
        // Create the boss sprite and make it clickable.
        this.bossSprite = this.add.sprite(250, 200, `${currentBoss.id}_0`).setInteractive({ useHandCursor: true });
        
        // Listen for a 'pointerdown' event on the boss sprite and call our handler.
        this.bossSprite.on('pointerdown', this.handleBossClick, this);

        // Subscribe to the Zustand store. The `handleStateChange` method will be
        // called every time the state changes anywhere in the app.
        this.store.subscribe(
            (newState, prevState) => this.handleStateChange(newState, prevState)
        );
    }
    
    // The main game loop, called on every single frame by Phaser.
    update(time, delta) {
        // Get the current game phase from the store.
        const { gamePhase, isHealing } = this.store.getState();

        // Pause the entire game loop if the game is not in the 'clicking' phase.
        if (gamePhase !== 'clicking' || isHealing) {
            return;
        t}

        // Add the time since the last frame to our tick timer.
        this.gameTick += delta;

        // If 1000ms (1 second) have passed...
        if (this.gameTick >= 1000) {
            // ...subtract 1000ms and run our per-second logic.
            this.gameTick -= 1000;
            
            // Get the actions from the store.
            const { applyDps, checkBossDefeat } = this.store.getState();
            
            // Call the actions. This will update the state in Zustand.
            applyDps();
            checkBossDefeat();
        }
    }

    handleBossClick(pointer) {
        // Get the current state and actions from the store.
        const { gamePhase, isHealing, isInvulnerable, calculateDamageRange, applyClick, playSound } = this.store.getState();
        
        // Guard clause: do nothing if we're not in the correct state to click.
        if (gamePhase !== 'clicking' || isHealing || isInvulnerable) return;

        // Tell the store to play the sound.
        playSound('oryx_hit', 0.5);

        // 1. READ from the store to calculate damage.
        const { minDamage, maxDamage } = calculateDamageRange();
        const damageDealt = Phaser.Math.Between(minDamage, maxDamage);
        
        // Let's keep fame simple for now: it's equal to damage dealt.
        const fameEarned = damageDealt;

        // 2. WRITE to the store by calling the `applyClick` action.
        applyClick(damageDealt, fameEarned);

        // 3. Handle purely VISUAL feedback within Phaser itself.
        this.showFloatingText(`-${damageDealt.toLocaleString()}`, pointer.x, pointer.y);
        this.cameras.main.shake(100, 0.005);
    }
    
    // This method is our subscription handler. It's called when the store's state changes.
    handleStateChange(newState, prevState) {
        const currentBoss = bosses[newState.currentBossIndex];
        if (!currentBoss) return;

        // Update boss sprite only if the boss has actually changed.
        if (newState.currentBossIndex !== prevState.currentBossIndex) {
            this.bossSprite.setTexture(`${currentBoss.id}_0`);
        }
        
        // Update the boss image phase based on its current health percentage.
        const healthPercent = 1 - (newState.clicksOnCurrentBoss / currentBoss.clickThreshold);
        const imageIndex = Math.floor(healthPercent * (currentBoss.images.length -1));
        const newTextureKey = `${currentBoss.id}_${Math.max(0, imageIndex)}`;
        
        // To be efficient, only change the texture if the key is different.
        if(this.bossSprite.texture.key !== newTextureKey) {
            this.bossSprite.setTexture(newTextureKey);
        }
        
        // Enable or disable clicking on the boss based on the game state.
        this.bossSprite.input.enabled = (newState.gamePhase === 'clicking' && !newState.isHealing && !newState.isInvulnerable);
    }
    
    // A helper function for creating floating text animations.
    showFloatingText(message, x, y, color = '#ffffff', fontSize = '20px') {
        let text = this.add.text(x, y, message, {
            fontFamily: 'Arial, "Press Start 2P"', // Added a fallback font
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
