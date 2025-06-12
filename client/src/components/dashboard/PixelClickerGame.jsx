import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Toaster } from 'react-hot-toast';

// Import all the different 'screens' or 'views' that our game can be in.
import { ClassSelection } from './clicker/ClassSelection';
import { GameContainer } from './clicker/GameContainer';
import { VictoryScreen } from './clicker/VictoryScreen';
import { Portal } from './clicker/Portal';
import { TransitionalScreen } from './clicker/TransitionalScreen';
import { WelcomeBackModal } from './clicker/WelcomeBackModal';

function PixelClickerGame() {
    // Select the state and actions that this top-level component needs to control the game's flow.
    const {
        gamePhase,
        loadInitialState
    } = useGameStore(state => ({
        gamePhase: state.gamePhase,
        loadInitialState: state.loadInitialState,
    }));
    
    // This is a local React state. It's only used for managing the visibility of the
    // "Welcome Back" modal and doesn't need to be in the global Zustand store.
    const [offlineProgress, setOfflineProgress] = useState(null);

    // This useEffect hook runs only ONCE when the component first mounts.
    useEffect(() => {
        // We call the `loadInitialState` action from our store.
        const progress = loadInitialState();
        
        // If the action returns any offline progress data, we set it in our local state
        // which will cause the WelcomeBackModal to appear.
        if (progress && progress.offlineEarnings > 0) {
            setOfflineProgress(progress);
        }
    }, [loadInitialState]); // The dependency array ensures this runs only once.
    
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
            {/* The Toaster component from react-hot-toast for showing notifications. */}
            <Toaster position="top-right" reverseOrder={false} />
            
            {/* The Welcome Back modal, which will only be visible if `offlineProgress` has data. */}
            <WelcomeBackModal
                offlineProgress={offlineProgress}
                onClose={() => setOfflineProgress(null)}
            />

            {/* The main wrapper for our game's currently active screen. */}
            <div className="game-wrapper">
                {renderGamePhase()}
            </div>
        </>
    );
}

export default PixelClickerGame;
