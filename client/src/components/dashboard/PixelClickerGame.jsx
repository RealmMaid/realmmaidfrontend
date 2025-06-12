import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Toaster } from 'react-hot-toast';
import EventBus from '../../EventBus';

// Import your REAL components from their separate files
import { GameContainer } from './clicker/GameContainer';
import { ClassSelection } from './clicker/ClassSelection';
import { WelcomeBackModal } from './clicker/WelcomeBackModal';

// This is the main parent component for the game.
export default function PixelClickerGame() {
    // Select state needed to decide what to render and actions to update state
    const { playerClass, setScore } = useGameStore(state => ({
        playerClass: state.playerClass,
        setScore: state.setScore,
    }));

    // Local state for managing UI elements like the offline modal
    const [offlineProgress, setOfflineProgress] = useState(null);
    const [isLoaded, setIsLoaded] = useState(useGameStore.persist.hasHydrated);

    // This useEffect sets up the listener that connects Phaser to our React store
    useEffect(() => {
        const onScoreUpdate = (newScore) => {
            // Update our Zustand store with the new score from the game
            setScore(newScore);
        };

        // Start listening for the 'scoreUpdated' event from our EventBus
        EventBus.on('scoreUpdated', onScoreUpdate);

        // Cleanup function to remove the listener when the component unmounts
        return () => {
            EventBus.off('scoreUpdated', onScoreUpdate);
        };
    }, [setScore]); // Dependency array ensures this setup only runs once

    // This effect handles the initial loading and offline progress check
    useEffect(() => {
        const handleRehydration = () => {
            const getOfflineProgress = () => { 
                const { lastUpdated, pointsPerSecond } = useGameStore.getState();
                if (!lastUpdated || !pointsPerSecond) return { fameEarned: 0, timeOffline: 0 };
                const now = Date.now();
                const timeOfflineInSeconds = Math.floor((now - lastUpdated) / 1000);
                const maxOfflineTime = 2 * 24 * 60 * 60; // 48 hours
                const effectiveTimeOffline = Math.min(timeOfflineInSeconds, maxOfflineTime);
                const fameEarned = Math.floor(effectiveTimeOffline * pointsPerSecond * 0.50); // 50% efficiency
                return { fameEarned, timeOffline: effectiveTimeOffline };
            };
            const progress = getOfflineProgress();
            
            if (progress && progress.fameEarned > 0) {
                setOfflineProgress(progress);
            }
            setIsLoaded(true);
        };

        if (useGameStore.persist.hasHydrated()) {
            handleRehydration();
        } else {
            const unsubscribe = useGameStore.persist.onFinishRehydration(handleRehydration);
            return unsubscribe;
        }
    }, []);

    if (!isLoaded) {
        return <div className="loading-screen">Loading Your Game...</div>;
    }

    return (
        <>
            <Toaster position="top-right" />
            
            <WelcomeBackModal
                offlineProgress={offlineProgress}
                onClose={() => setOfflineProgress(null)}
            />

            {playerClass ? <GameContainer /> : <ClassSelection />}
        </>
    );
}
