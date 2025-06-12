import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../../stores/gameStore';

// --- UI Component Imports ---
import { Hud } from './Hud';
import { ShopArea } from './ShopArea';
import { AbilityBar } from './AbilityBar';
import { BossDisplay } from './BossDisplay';
import { ClassSelection } from './ClassSelection';
import { TransitionalScreen } from './TransitionalScreen';
import { VictoryScreen } from './VictoryScreen';

/**
 * GameContainer Component
 * This is the main controller for the clicker game's UI.
 * It renders the correct screen based on gamePhase and runs the main game loop.
 */
export function GameContainer() {
    // Get the gamePhase to decide what to show
    const gamePhase = useGameStore(state => state.gamePhase);
    
    // Get the gameTick function from the store
    const gameTick = useGameStore(state => state.gameTick);
    const checkBossDefeat = useGameStore(state => state.checkBossDefeat);
    const lastTimeRef = useRef(performance.now());

    // ✨ NEW: This is our game loop! ✨
    useEffect(() => {
        let animationFrameId;

        // The function that runs on every frame
        const loop = (currentTime) => {
            const deltaTime = currentTime - lastTimeRef.current;
            lastTimeRef.current = currentTime;
            
            // Call our store's gameTick function with the time that has passed
            gameTick(deltaTime);

            // We can also check for boss defeat here continuously
            checkBossDefeat();

            // Request the next frame
            animationFrameId = requestAnimationFrame(loop);
        };

        // Start the loop
        animationFrameId = requestAnimationFrame(loop);

        // Cleanup function to stop the loop when the component unmounts
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [gameTick, checkBossDefeat]); // We include the functions in the dependency array

    const renderGamePhase = () => {
        switch (gamePhase) {
            case 'classSelection':
                return <ClassSelection />;
            case 'clicking':
                return (
                    <>
                        <Hud />
                        <hr style={{ margin: '1rem 0' }} />
                        <div className="boss-display-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                           <BossDisplay />
                        </div>
                        <AbilityBar />
                        <ShopArea />
                    </>
                );
            case 'transitioning':
            case 'exalted_transition':
                return <TransitionalScreen />;
            case 'finished':
                return <VictoryScreen />;
            default:
                return <ClassSelection />;
        }
    };

    return (
        <div className="card">
            <div className="clicker-container">
                {renderGamePhase()}
            </div>
        </div>
    );
}
