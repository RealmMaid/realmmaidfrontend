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
        // ✨ NEW: This guard makes our loop much safer!
        // It ensures the game logic only runs when we are in the main 'clicking' phase.
        if (gamePhase !== 'clicking') {
            return; // Do nothing if we're not in the right phase.
        }

        let animationFrameId;
        const loop = (currentTime) => {
            // We reset the time reference when the loop starts to avoid a huge deltaTime jump.
            if (!lastTimeRef.current) {
                lastTimeRef.current = currentTime;
            }
            const deltaTime = currentTime - lastTimeRef.current;
            lastTimeRef.current = currentTime;
            
            // Only call the core game logic if we are in the clicking phase
            gameTick(deltaTime);
            checkBossDefeat();

            animationFrameId = requestAnimationFrame(loop);
        };
        
        // Reset the timer ref and start the loop
        lastTimeRef.current = null;
        animationFrameId = requestAnimationFrame(loop);

        // The cleanup function will stop the loop when the component unmounts
        // or when the gamePhase changes, preventing the error.
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [gamePhase, gameTick, checkBossDefeat]); // ✨ Reruns the effect when gamePhase changes

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
