import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Toaster } from 'react-hot-toast';
import EventBus from '../../EventBus';

// Import your components from their correct sub-folders
import { GameContainer } from './clicker/GameContainer';
import { ClassSelection } from './clicker/ClassSelection'; // <-- CORRECTED PATH
import { WelcomeBackModal } from './clicker/WelcomeBackModal';

export default function PixelClickerGame() {
    // Get the playerClass to decide what to render, and the setScore action for our event listener
    const { playerClass, setScore } = useGameStore(state => ({
        playerClass: state.playerClass,
        setScore: state.setScore,
    }));

    // This local state manages the offline progress modal
    const [offlineProgress, setOfflineProgress] = useState(null);
    // This local state prevents the game from rendering before saved data is loaded
    const [isLoaded, setIsLoaded] = useState(useGameStore.persist.hasHydrated);

    // This useEffect hook sets up the event listener to get updates from Phaser
    useEffect(() => {
        const onScoreUpdate = (newScore) => {
            // Update the Zustand store when Phaser emits a score update
            setScore(newScore);
        };

        // Listen for the 'scoreUpdated' event from our EventBus
        EventBus.on('scoreUpdated', onScoreUpdate);

        // Cleanup function to remove the listener when the component unmounts
        return () => {
            EventBus.off('scoreUpdated', onScoreUpdate);
        };
    }, [setScore]); // The dependency array ensures this setup only runs once


    // This effect handles the initial loading and offline progress
    useEffect(() => {
        const handleRehydration = () => {
            // We need to define getOfflineProgress or import it if it's separate
            const getOfflineProgress = () => { 
                const { lastUpdated, pointsPerSecond } = useGameStore.getState();
                if (!lastUpdated || !pointsPerSecond) return { fameEarned: 0, timeOffline: 0 };
                const now = Date.now();
                const timeOfflineInSeconds = Math.floor((now - lastUpdated) / 1000);
                const maxOfflineTime = 2 * 24 * 60 * 60;
                const effectiveTimeOffline = Math.min(timeOfflineInSeconds, maxOfflineTime);
                const fameEarned = Math.floor(effectiveTimeOffline * pointsPerSecond * 0.50);
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
