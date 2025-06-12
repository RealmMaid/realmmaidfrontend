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

    // ====================================================================
    // THIS IS THE CRUCIAL LISTENER THAT WAS MISSING
    // ====================================================================
    useEffect(() => {
        // This function will run when the 'class_selected' event is heard
        const handleClassSelected = (event) => {
            const classId = event.detail;
            // Safely call the store action
            useGameStore.getState().handleClassSelect(classId);
        };

        // Add the event listener to the window
        window.addEventListener('class_selected', handleClassSelected);

        // Return a cleanup function to remove the listener when the component unmounts
        return () => {
            window.removeEventListener('class_selected', handleClassSelected);
        };
    }, []); // The empty array ensures this listener is set up only once.


    // This useEffect handles offline progress calculation
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

    // The hydration gate
    if (!isHydrated) {
        return <div>Loading Game...</div>;
    }
    
    // This function decides which main component to show
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
