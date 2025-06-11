import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { CombatScene } from '../../scenes/CombatScene'; // ✨ Import our new scene! ✨

function PhaserGame() {
    const gameRef = useRef(null);

    useEffect(() => {
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'phaser-container',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 }
                }
            },
            // ✨ We just give Phaser our Scene class! So clean! ✨
            scene: [CombatScene]
        };

        gameRef.current = new Phaser.Game(config);

        return () => {
            gameRef.current.destroy(true);
        };
    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
