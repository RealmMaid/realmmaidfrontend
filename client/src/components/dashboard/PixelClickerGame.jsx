import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore.jsx';
import { Toaster } from 'react-hot-toast';

import { calculateOfflineProgress } from '../../utils/calculationUtils.js';

import { ClassSelection } from './clicker/ClassSelection';
import { GameContainer } from './clicker/GameContainer';
import { VictoryScreen } from './clicker/VictoryScreen';
import { Portal } from './clicker/Portal';
import { TransitionalScreen } from './clicker/TransitionalScreen';
import { WelcomeBackModal } from './clicker/WelcomeBackModal';

/**
 * This is a new, dedicated hook to safely check if the Zustand store has been rehydrated.
 * It uses the official `persist` middleware API.
 * It will not cause the React "suspend" error.
 */
const useHydration = () => {
  const [hydrated, setHydrated] = useState(useGameStore.persist.hasHydrated);

  useEffect(() => {
    const unsubFinishHydration = useGameStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    setHydrated(useGameStore.persist.hasHydrated());

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};


function PixelClickerGame() {
    // 1. Call our new safe hook first.
    const isHydrated = useHydration();

    // 2. We can now safely get the rest of the state.
    const gamePhase = useGameStore((state) => state.gamePhase);

    const [offlineProgress, setOfflineProgress] = useState(null);
    useEffect(() => {
        // This effect should only run AFTER hydration is complete.
        if (isHydrated) {
            const currentState = useGameStore.getState();
            const { applyOfflineProgress } = currentState;
            const progress = calculateOfflineProgress(currentState);
            
            if (progress && progress.offlineEarnings > 0) {
                applyOfflineProgress(progress.offlineEarnings);
                setOfflineProgress(progress);
            }
        }
    }, [isHydrated]); // Dependency on `isHydrated` ensures this.

    // 3. Our gate now uses the state from our safe hook.
    if (!isHydrated) {
        return <div>Loading Game...</div>;
    }
    
    const renderGamePhase = () => {
        switch (gamePhase) {
            case 'classSelection':
                return <ClassSelection />;
            case 'clicking':
                return <GameContainer />;
            case 'transitioning':
            case 'exalted_transition':
                return <TransitionalScreen />;
            case 'portal':
                return <Portal />;
            case 'finished':
                return <VictoryScreen />;
            default:
                return <GameContainer />;
        }
    };

    return (
        <>
            <Toaster position="top-right" reverseOrder={false} />
            
            <WelcomeBackModal
                offlineProgress={offlineProgress}
                onClose={() => setOfflineProgress(null)}
            />

            <div className="game-wrapper">
                {renderGamePase()}
            </div>
        </>
    );
}

export default PixelClickerGame;
