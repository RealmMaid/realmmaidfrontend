import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore.jsx'; // Make sure this has the .jsx extension
import { Toaster } from 'react-hot-toast';

// Import all the different 'screens' or 'views' that our game can be in.
import { ClassSelection } from './clicker/ClassSelection';
import { GameContainer } from './clicker/GameContainer';
import { VictoryScreen } from './clicker/VictoryScreen';
import { Portal } from './clicker/Portal';
import { TransitionalScreen } from './clicker/TransitionalScreen';
import { WelcomeBackModal } from './clicker/WelcomeBackModal';

function PixelClickerGame() {
    // We only need to select the gamePhase here for rendering.
    const gamePhase = useGameStore(state => state.gamePhase);
    
    // This is a local React state for managing the visibility of the modal.
    const [offlineProgress, setOfflineProgress] = useState(null);

    // This useEffect hook runs only ONCE when the component first mounts.
    useEffect(() => {
        // THIS IS THE FIX:
        // We call the action directly from the store's static `getState()` method.
        // This ensures the function has the correct context and can access `get()` and `set()`.
        const progress = useGameStore.getState().loadInitialState();
        
        // If the action returns any offline progress data, we set it in our local state.
        if (progress && progress.offlineEarnings > 0) {
            setOfflineProgress(progress);
        }
    }, []); // The empty dependency array ensures this runs only once.
    
    // This function acts as a router, rendering the correct component
    // based on the current `gamePhase` string from our Zustand store.
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
