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
            // Ensure we don't have a massive jump in deltaTime on the first frame of the loop.
            if (!lastTimeRef.current) {
                lastTimeRef.current = currentTime;
            }
            const deltaTime = currentTime - lastTimeRef.current;
            lastTimeRef.current = currentTime;
            
            // Call the core game logic functions from the store.
            gameTick(deltaTime);
            checkBossDefeat();

            // Continue the loop.
            animationFrameId = requestAnimationFrame(loop);
        };
        
        // The setTimeout trick: this delays the start of our game loop by one browser tick.
        // This is just enough time for React to finish its current rendering work (like showing
        // the BossDisplay) before we start making rapid state updates in the loop.
        // This prevents the race condition that causes error #185.
        const timeoutId = setTimeout(() => {
            lastTimeRef.current = null; // Reset timer to start fresh.
            animationFrameId = requestAnimationFrame(loop);
        }, 3);


        // The cleanup function is crucial. It runs when the component unmounts OR when
        // the gamePhase changes, because gamePhase is in the dependency array.
        // This ensures we always stop the old loop before starting a new one.
        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(animationFrameId);
        };
    }, [gamePhase, gameTick, checkBossDefeat]); // The effect re-runs whenever the gamePhase changes.

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
