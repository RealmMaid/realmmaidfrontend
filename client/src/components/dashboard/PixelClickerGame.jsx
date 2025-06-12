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
 * A dedicated hook to safely check if the Zustand store has been rehydrated.
 * It uses the official `persist` middleware API and will not cause a suspend error.
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
    const isHydrated = useHydration();
    const gamePhase = useGameStore((state) => state.gamePhase);
    const [offlineProgress, setOfflineProgress] = useState(null);

    // This useEffect hook sets up the listener for our custom event.
    useEffect(() => {
        // This is the function that will run when the 'class_selected' event is heard.
        const handleClassSelected = (event) => {
            // Get the classId from the event's 'detail' property.
            const classId = event.detail;
            // Now, we can safely call the store action using the reliable getState() method.
            useGameStore.getState().handleClassSelect(classId);
        };

        // Add the event listener to the main window object.
        window.addEventListener('class_selected', handleClassSelected);

        // This is a crucial cleanup step to prevent memory leaks.
        // It removes the listener when the component is no longer on the screen.
        return () => {
            window.removeEventListener('class_selected', handleClassSelected);
        };
    }, []); // The empty array ensures this listener is set up only once.

    // This useEffect hook handles the offline progress calculation.
    // It depends on `isHydrated` to make sure it only runs after the store is ready.
    useEffect(() => {
        if (isHydrated) {
            const currentState = useGameStore.getState();
            const { applyOfflineProgress } = currentState;
            const progress = calculateOfflineProgress(currentState);
            
            if (progress && progress.offlineEarnings > 0) {
                applyOfflineProgress(progress.offlineEarnings);
                setOfflineProgress(progress);
            }
        }
    }, [isHydrated]);

    // This is our "hydration gate" that prevents interaction until the store is loaded.
    if (!isHydrated) {
        return <div>Loading Game...</div>;
    }
    
    // This function decides which main component to show based on the game's current phase.
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
                {renderGamePhase()}
            </div>
        </>
    );
}

export default PixelClickerGame;
