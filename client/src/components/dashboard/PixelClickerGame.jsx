import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore.jsx';
import { Toaster } from 'react-hot-toast';

// 1. Import the new utility function
import { calculateOfflineProgress } from '../../utils/calculationUtils.js';

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
        // 2. Get the entire current state from the store
        const currentState = useGameStore.getState();
        const { applyOfflineProgress } = currentState;

        // 3. Pass the state to our external, pure function
        const progress = calculateOfflineProgress(currentState);
        
        if (progress && progress.offlineEarnings > 0) {
            // 4. Call the simple action to update the store
            applyOfflineProgress(progress.offlineEarnings);
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
