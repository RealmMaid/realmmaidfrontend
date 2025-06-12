import React, { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import EventBus from '../../EventBus';
import { Toaster } from 'react-hot-toast';

// Import the two main views this component will switch between
import { GameContainer } from './clicker/GameContainer';
import { ClassSelection } from './clicker/ClassSelection';

export default function PixelClickerGame() {
    // Get the state and actions needed for this controller
    const { playerClass, setScore } = useGameStore(state => ({
        playerClass: state.playerClass,
        setScore: state.setScore,
    }));

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
        <>
            <Toaster position="top-right" />
            
            {/* This is the main logic for the page.
              If a player class hasn't been chosen, show the ClassSelection component.
              Otherwise, show the main GameContainer.
            */}
            {playerClass ? <GameContainer /> : <ClassSelection />}
        </>
    );
}
