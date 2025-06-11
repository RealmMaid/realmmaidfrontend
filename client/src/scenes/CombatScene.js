// ... inside the CombatScene class ...

    playerHit(player, laser) {
        // ... all the damage and invincibility logic is the same ...
        if (this.playerHealth <= 0) {
            this.sound.play('player-death');
            this.physics.pause();
            player.setTint(0xff0000);
            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'GAME OVER', { /* ... */ }).setOrigin(0.5);
            const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'Click to Return to Map', { /* ... */ }).setOrigin(0.5).setInteractive();
            
            // ✨ UPDATED: This now goes back to the MapScene! ✨
            restartText.on('pointerdown', () => {
                this.scene.start('MapScene'); 
            });
        } else {
            // ...
        }
    }

    bossHit(boss, laser) {
        // ... damage logic ...
        if (this.bossHealth <= 0) {
            this.sound.play('boss-death');
            boss.setActive(false).setVisible(false);
            
            // ✨ NEW: A "YOU WIN!" screen! ✨
            this.physics.pause();
            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'YOU WIN!', { fontSize: '64px', fill: '#00e6cc' }).setOrigin(0.5);
            const playAgainText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'Click to Return to Map', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5).setInteractive();
            
            // ✨ UPDATED: This also goes back to the MapScene! ✨
            playAgainText.on('pointerdown', () => {
                this.scene.start('MapScene');
            });
        } else {
            this.sound.play('boss-hit');
        }
    }

// ... rest of the file is the same ...
