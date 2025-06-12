// --- PHASER SCENE DEFINITION ---
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    init() {
        console.log("Phaser: Initializing game state...");
        this.gameState = {
            score: 0,
            pointsPerSecond: 0,
            currentBossIndex: 0,
            clicksOnCurrentBoss: 0,
        };
    }

    preload() {
        console.log("Phaser: Preloading assets...");
        this.load.image('oryx1', '/oryx.png');
        // Let's also load the hit sound from your original project!
        this.load.audio('oryx_hit', '/oryxhit.mp3');
    }

    create() {
        console.log("Phaser: Create method called!");
        
        // We need to store the boss image in a variable so we can interact with it
        const bossImage = this.add.image(400, 300, 'oryx1');

        // ✨ --- NEW: Make the boss interactive --- ✨

        // 1. Enable input events on the boss sprite
        bossImage.setInteractive({ useHandCursor: true });

        // 2. Set up a listener for the 'pointerdown' event (Phaser's version of a click)
        bossImage.on('pointerdown', () => {
            // This code runs every time the boss is clicked!

            // Update the score in our game state
            this.gameState.score += 1;
            this.gameState.clicksOnCurrentBoss += 1;

            // Update the score text on the screen to show the new value
            this.scoreText.setText(`Fame: ${this.gameState.score}`);

            // Play the hit sound for feedback
            this.sound.play('oryx_hit', { volume: 0.5 });

            // Add a simple "tween" animation for visual feedback
            // This makes the boss shrink and then pop back to its original size.
            this.tweens.add({
                targets: bossImage,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 50, // Duration of the shrink in milliseconds
                yoyo: true, // Automatically reverses the animation
                ease: 'Power1'
            });
        });
        
        // The score text object, same as before
        this.scoreText = this.add.text(50, 50, `Fame: ${this.gameState.score}`, { 
            font: '24px "Press Start 2P"',
            fill: '#ffffff' 
        });
    }

    update(time, delta) {
        // The game loop!
    }
}
