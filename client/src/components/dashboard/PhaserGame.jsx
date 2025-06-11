import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { CombatScene } from '../../scenes/CombatScene';
import { MapScene } from '../../scenes/MapScene'; // ✨ Import our new MapScene! ✨

function PhaserGame() {
    const gameRef = useRef(null);

    useEffect(() => {
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'phaser-container',
            // ✨ We give Phaser a list of all our scenes! ✨
            // The first one in the list is the one that starts automatically.
            scene: [MapScene, CombatScene]
        };

        gameRef.current = new Phaser.Game(config);

        return () => {
            gameRef.current.destroy(true);
        };
    }, []);

    return <div id="phaser-container" />;
}

export default PhaserGame;
