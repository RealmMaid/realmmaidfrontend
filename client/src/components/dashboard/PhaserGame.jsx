import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from './game/MainScene';
import { useGameStore } from '../../stores/gameStore';

function PhaserGame() {
    const phaserRef = useRef(null);
    const gameInstanceRef = useRef(null);

    // Get the whole store instance. We will pass this to Phaser.
    const store = useGameStore();

    useEffect(() => {
        // Do nothing if the component's div isn't rendered yet, or if the store isn't ready.
        if (!phaserRef.current || !store) return;

        const config = {
            type: Phaser.AUTO,
            width: 500,
            height: 400,
            parent: phaserRef.current,
            backgroundColor: 'transparent',
            scene: [MainScene]
        };

        // Create the game instance only once.
        if (!gameInstanceRef.current) {
            gameInstanceRef.current = new Phaser.Game(config);
            // This is the critical step: we pass the store instance into our scene's `init` method.
            gameInstanceRef.current.scene.start('MainScene', { store: store });
        }

        // The cleanup function to destroy the game when the component unmounts.
        return () => {
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
        };
    }, [store]); // The dependency array ensures this effect runs only when the store is available.

    // This div is where Phaser will mount its canvas.
    return <div ref={phaserRef} id="phaser-container" />;
}

export default PhaserGame;
