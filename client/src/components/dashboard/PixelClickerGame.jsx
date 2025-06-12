import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Toaster } from 'react-hot-toast';
import EventBus from '../../EventBus'; // ✨ NEW: Import our Event Bus

// Import your components
import { GameContainer } from './clicker/GameContainer';
import { ClassSelection } from './ClassSelection';
// ... other imports

export default function PixelClickerGame() {
    const { playerClass, setScore } = useGameStore(state => ({
        playerClass: state.playerClass,
        setScore: state.setScore, // ✨ NEW: Get the setScore action
    }));

    const [isLoaded, setIsLoaded] = useState(true); // Simplified for now

    // ✨ NEW: This useEffect sets up the event listeners
    useEffect(() => {
        // The handler function that will be called when the event is emitted
        const onScoreUpdate = (newScore) => {
            console.log('React received score update:', newScore);
            // Call the Zustand action to update the global state
            setScore(newScore);
        };

        // Listen for the 'scoreUpdated' event
        EventBus.on('scoreUpdated', onScoreUpdate);

        // Cleanup function to remove the listener when the component unmounts
        return () => {
            EventBus.off('scoreUpdated', onScoreUpdate);
        };
    }, [setScore]); // Dependency array ensures this only runs once

    if (!isLoaded) {
        return <div className="loading-screen">Loading...</div>;
    }

    return (
        <>
            <Toaster position="top-right" />
            {playerClass ? <GameContainer /> : <ClassSelection />}
        </>
    );
}
