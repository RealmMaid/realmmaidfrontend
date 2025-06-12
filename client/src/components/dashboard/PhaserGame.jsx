import EventBus from '../../EventBus'; // ✨ NEW: Import our Event Bus

// --- PHASER SCENE DEFINITION ---
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    init() {
        this.gameState = {
            score: 0,
            pointsPerSecond: 5,
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
            // ✨ NEW: Emit an event with the new score
            EventBus.emit('scoreUpdated', this.gameState.score);
            
            this.sound.play('oryx_hit', { volume: 0.5 });
            this.tweens.add({ /* ... tween logic ... */ });
        });
        
        // We no longer need the Phaser score text, as React will handle it.
        // this.scoreText = this.add.text(...) 

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
        // ✨ NEW: Emit an event with the new score
        EventBus.emit('scoreUpdated', this.gameState.score);
    }

    update(time, delta) { /* ... */ }
}
export default PhaserGame;
