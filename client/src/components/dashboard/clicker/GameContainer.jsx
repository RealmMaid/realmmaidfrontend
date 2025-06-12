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
import { NotificationManager } from './NotificationManager';

/**
 * GameContainer Component
 * This is the main controller for the clicker game's UI.
 */
export function GameContainer() {
    const gamePhase = useGameStore(state => state.gamePhase);
    const gameTick = useGameStore(state => state.gameTick);
    const checkBossDefeat = useGameStore(state => state.checkBossDefeat);
    const lastTimeRef = useRef(performance.now());

    // Main game loop
    useEffect(() => {
        // This guard ensures the game logic only runs when we are in the main 'clicking' phase.
        if (gamePhase !== 'clicking') {
            return; // Do nothing if we're not in the right phase.
        }

        let animationFrameId;
        const loop = (currentTime) => {
            if (!lastTimeRef.current) {
                lastTimeRef.current = currentTime;
            }
            const deltaTime = currentTime - lastTimeRef.current;
            lastTimeRef.current = currentTime;
            
            gameTick(deltaTime);
            checkBossDefeat();

            animationFrameId = requestAnimationFrame(loop);
        };
        
        // ✨ NEW: We use a setTimeout to delay the start of the loop by one frame.
        // This gives React time to finish its render and prevents a race condition.
        const timeoutId = setTimeout(() => {
            lastTimeRef.current = null; // Reset timer to prevent a large initial jump
            animationFrameId = requestAnimationFrame(loop);
        }, 0);


        // The cleanup function will stop the loop when the component unmounts
        // or when the gamePhase changes, preventing the error.
        return () => {
            clearTimeout(timeoutId); // Also clear the timeout on cleanup
            cancelAnimationFrame(animationFrameId);
        };
    }, [gamePhase, gameTick, checkBossDefeat]); // Reruns the effect when gamePhase changes

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
            <NotificationManager />
            <div className="clicker-container">
                {renderGamePhase()}
            </div>
        </div>
    );
}
