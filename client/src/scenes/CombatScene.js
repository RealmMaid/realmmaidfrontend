import Phaser from 'phaser';

// All our constants can live here now!
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BOSS_SPEED = 150;
const BOSS_INITIAL_HEALTH = 1000;
const PROJECTILE_SPEED = 400;
const PLAYER_INITIAL_HEALTH = 200;
const PROJECTILE_DAMAGE = 10;
const PLAYER_PROJECTILE_SPEED = -600;
const BOSS_PHASE_HEAL_AMOUNT = 250;

// Our whole game is now a proper Scene class! So professional!
export class CombatScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CombatScene' });
    }

    init() {
        this.playerHealth = PLAYER_INITIAL_HEALTH;
        this.bossHealth = BOSS_INITIAL_HEALTH;
        this.bossPhase = 1;
    }

    preload() {
        this.load.image('player', '/wizard.png');
        this.load.image('boss', '/oryx.png');
        this.load.image('boss-beamslash', '/beamslash.png');
        this.load.image('player-beamslash', '/player-beamslash.png');
        this.load.audio('boss-hit', '/oryxhit.mp3');
        this.load.audio('boss-death', '/oryxdeath.mp3');
        this.load.audio('player-death', '/wizarddeath.mp3');
    }

    create() {
        this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'player');
        this.player.setCollideWorldBounds(true).setScale(0.4);
        this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.8);
        this.player.isInvincible = false;
            
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.boss = this.physics.add.sprite(100, 80, 'boss');
        this.boss.setCollideWorldBounds(true).setVelocityX(BOSS_SPEED);
        this.boss.body.setSize(this.boss.width * 0.8, this.boss.height * 0.7);
        this.boss.isInvincible = false;

        this.bossProjectiles = this.physics.add.group({ defaultKey: 'boss-beamslash', maxSize: 50 });
        this.playerProjectiles = this.physics.add.group({ defaultKey: 'player-beamslash', maxSize: 10 });
        this.stunProjectiles = this.physics.add.group({ defaultKey: 'stun-shot', maxSize: 5 });
            
        this.healthText = this.add.text(10, 10, `Health: ${this.playerHealth}`, { fontSize: '24px', fill: '#ffffff' });
        this.bossHealthText = this.add.text(GAME_WIDTH - 10, 10, `Boss HP: ${this.bossHealth}`, { fontSize: '24px', fill: '#ffffff' }).setOrigin(1, 0);

        this.shotCounter = 0;
        this.bossShootingTimer = this.time.addEvent({
            delay: 1500,
            callback: () => { /* ... timer logic ... */ },
            loop: true
        });

        this.physics.add.overlap(this.player, this.bossProjectiles, this.playerHit, null, this);
        this.physics.add.overlap(this.boss, this.playerProjectiles, this.bossHit, null, this);
    }

    update() {
        // ... all update logic ...
    }

    playerHit(player, laser) {
        // ... all playerHit logic ...
    }

    bossHit(boss, laser) {
        // ... all bossHit logic ...
    }

    // You can even put helper functions right in the class!
    shootSingleLaser() { /* ... */ }
    shootShotgunBlast() { /* ... */ }
}
