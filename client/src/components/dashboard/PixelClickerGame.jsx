import React, { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import EventBus from '../../EventBus';
import { Toaster } from 'react-hot-toast';

// Import the UI and the Game component
import { Hud } from './clicker/Hud';
import PhaserGame from './PhaserGame'; // Note the direct import

export default function PixelClickerGame() {
    // Get the `setScore` action from our store
    const setScore = useGameStore(state => state.setScore);

    // This useEffect hook sets up the listener that connects Phaser to our React store
    useEffect(() => {
        // This function will be called every time Phaser emits 'scoreUpdated'
        const onScoreUpdate = (newScore) => {
            // Update our Zustand store with the new score from the game
            setScore(newScore);
        };

        // Start listening for the event from our EventBus
        EventBus.on('scoreUpdated', onScoreUpdate);

        // Cleanup function to remove the listener when the component unmounts
        return () => {
            EventBus.off('scoreUpdated', onScoreUpdate);
        };
    }, [setScore]); // The dependency array ensures this setup only runs once

    return (
        <div className="card">
            <div className="clicker-container">
                {/* 1. We render our React HUD component here */}
                <Hud />

                <hr style={{ margin: '1rem 0', borderColor: '#4a1566' }} />

                {/* 2. We render our Phaser Game component here */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PhaserGame />
                </div>
            </div>
            <Toaster position="top-right" />
        </div>
    );
}
