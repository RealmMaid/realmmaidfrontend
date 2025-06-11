import Phaser from 'phaser';

// This is our new scene for the world map!
export class MapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapScene' });
    }

    create() {
        // Just giving it a different background color for now
        this.cameras.main.setBackgroundColor('#3d874b');

        this.add.text(400, 250, 'You are on the World Map!', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const enterCombatText = this.add.text(400, 350, 'Enter the Boss Dungeon! >:3', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive(); // .setInteractive() makes it clickable!

        // When the text is clicked, we start the CombatScene!
        enterCombatText.on('pointerdown', () => {
            this.scene.start('CombatScene');
        });
    }
}
