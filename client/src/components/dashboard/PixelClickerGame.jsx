import React, { useEffect, useState } from 'react';
import { useGameStore, getOfflineProgress } from '../../stores/gameStore';
import { Toaster } from 'react-hot-toast';

// Import your REAL components from their separate files.
// This path is now correct and will resolve the build error.
import { GameContainer } from './clicker/GameContainer';
import { ClassSelection } from './ClassSelection';
import { WelcomeBackModal } from './WelcomeBackModal';

// This is the main parent component for the game.
export default function PixelClickerGame() {
    const playerClass = useGameStore(state => state.playerClass);
    const [offlineProgress, setOfflineProgress] = useState(null);
    const [isLoaded, setIsLoaded] = useState(useGameStore.persist.hasHydrated);

    useEffect(() => {
        const handleRehydration = () => {
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
