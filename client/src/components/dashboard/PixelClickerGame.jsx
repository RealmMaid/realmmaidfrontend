import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore.jsx';
import { Toaster } from 'react-hot-toast';

import { ClassSelection } from './clicker/ClassSelection';
import { GameContainer } from './clicker/GameContainer';
import { VictoryScreen } from './clicker/VictoryScreen';
import { Portal } from './clicker/Portal';
import { TransitionalScreen } from './clicker/TransitionalScreen';
import { WelcomeBackModal } from './clicker/WelcomeBackModal';

function PixelClickerGame() {
    const gamePhase = useGameStore(state => state.gamePhase);
    
    const [offlineProgress, setOfflineProgress] = useState(null);

    useEffect(() => {
        // Get the specific functions we need from the store.
        const { calculateOfflineProgress, applyOfflineProgress } = useGameStore.getState();

        // 1. First, we call the safe calculation function.
        const progress = calculateOfflineProgress();
        
        // 2. If there are earnings to apply...
        if (progress && progress.offlineEarnings > 0) {
            // ...we call the new, safe action to update the store's state.
            applyOfflineProgress(progress.offlineEarnings);
            // ...and then we set the local state to show the modal.
            setOfflineProgress(progress);
        }
    }, []);
    
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
