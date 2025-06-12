import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore.jsx';
import { Toaster } from 'react-hot-toast';

import { calculateOfflineProgress } from '../../utils/calculationUtils.js';

import { ClassSelection } from './clicker/ClassSelection';
import { GameContainer } from './clicker/GameContainer';
import { VictoryScreen } from './clicker/VictoryScreen';
import { Portal } from './clicker/Portal';
import { TransitionalScreen } from './clicker/TransitionalScreen';
import { WelcomeBackModal } from './clicker/WelcomeBackModal';

function PixelClickerGame() {
    // Subscribe to both the gamePhase and our new hydration flag
    const { gamePhase, hasHydrated } = useGameStore(state => ({
        gamePhase: state.gamePhase,
        hasHydrated: state._hasHydrated,
    }));
    
    const [offlineProgress, setOfflineProgress] = useState(null);

    // This useEffect hook runs only ONCE when the component first mounts.
    useEffect(() => {
        // Get the specific functions we need from the store's static getState method.
        const { applyOfflineProgress } = useGameStore.getState();
        // We pass the entire state to our external utility function.
        const progress = calculateOfflineProgress(useGameStore.getState());
        
        if (progress && progress.offlineEarnings > 0) {
            // Call the simple action to update the store's state.
            applyOfflineProgress(progress.offlineEarnings);
            // And then set the local state to show the modal.
            setOfflineProgress(progress);
        }
    }, []);

    // THE HYDRATION GATE:
    // If the store has not finished rehydrating, we show a loading message
    // and prevent any game components from rendering and being interacted with.
    if (!hasHydrated) {
        return <div>Loading Game...</div>;
    }
    
    // This part of the component will only ever run AFTER hydration is complete.
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
                // As a fallback, we show the main game container.
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
