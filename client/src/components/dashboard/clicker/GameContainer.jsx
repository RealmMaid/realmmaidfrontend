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
        let animationFrameId;

        const loop = (currentTime) => {
            const deltaTime = currentTime - lastTimeRef.current;
            lastTimeRef.current = currentTime;
            
            // These functions are now "smart" and have internal guards.
            // It's safe to call them on every frame, regardless of game phase.
            gameTick(deltaTime);
            checkBossDefeat();

            animationFrameId = requestAnimationFrame(loop);
        };
        
        // We start the loop once when the component mounts and let it run.
        lastTimeRef.current = performance.now();
        animationFrameId = requestAnimationFrame(loop);

        // The cleanup function stops the loop when the page is closed or you navigate away.
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [gameTick, checkBossDefeat]); // This dependency array is now static, so the effect only runs once.

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
