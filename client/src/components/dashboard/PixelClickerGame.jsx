import React, { useEffect, useState } from 'react';
import { useGameStore, getOfflineProgress } from '../../stores/gameStore';
import { Toaster } from 'react-hot-toast';

// Import your REAL components from their separate files.
// This path to GameContainer is now correct and will resolve the build error.
import { GameContainer } from './clicker/GameContainer';
import { ClassSelection } from './clicker/ClassSelection';
import { WelcomeBackModal } from './clicker/WelcomeBackModal;

// This is the main parent component for the game. Its only job is to
// manage loading and decide which major screen to show.
export default function PixelClickerGame() {
    // Select the necessary state to decide what to render
    const playerClass = useGameStore(state => state.playerClass);

    // This local state manages the offline progress modal
    const [offlineProgress, setOfflineProgress] = useState(null);
    // This local state prevents the game from rendering before saved data is loaded
    const [isLoaded, setIsLoaded] = useState(useGameStore.persist.hasHydrated);

    // This effect runs once on load to check for offline progress
    useEffect(() => {
        const handleRehydration = () => {
            const progress = getOfflineProgress();
            
            if (progress && progress.fameEarned > 0) {
                setOfflineProgress(progress);
            }
            setIsLoaded(true); // Mark the game as ready to be displayed
        };

        // Zustand gives us tools to safely wait for saved data to load
        if (useGameStore.persist.hasHydrated()) {
            handleRehydration();
        } else {
            const unsubscribe = useGameStore.persist.onFinishRehydration(handleRehydration);
            return unsubscribe; // Cleanup the listener
        }
    }, []); // Empty array `[]` ensures this runs only once.

    // While loading, show a simple loading screen
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

            {/* This ternary will now render your REAL, feature-rich components */}
            {playerClass ? <GameContainer /> : <ClassSelection />}
        </>
    );
}
