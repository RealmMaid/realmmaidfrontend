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
    const loopIdRef = useRef(0); // To give each loop a unique ID for logging

    // Main game loop
    useEffect(() => {
        const currentLoopId = ++loopIdRef.current;
        console.log(`💖 GameContainer useEffect RUNNING (ID: ${currentLoopId}). Current gamePhase: "${gamePhase}"`);

        // This guard ensures the game logic only runs when we are in the main 'clicking' phase.
        if (gamePhase !== 'clicking') {
            console.log(`[ID: ${currentLoopId}] Phase is not 'clicking'. Effect will now return and do nothing.`);
            return; // Do nothing if we're not in the right phase.
        }

        console.log(`[ID: ${currentLoopId}] Phase IS 'clicking'! Setting up the game loop.`);
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
        
        console.log(`[ID: ${currentLoopId}] Setting a timeout to start the loop...`);
        const timeoutId = setTimeout(() => {
            console.log(`⏰ [ID: ${currentLoopId}] setTimeout has triggered! Starting the animation frame loop NOW.`);
            lastTimeRef.current = null;
            animationFrameId = requestAnimationFrame(loop);
        }, 0);


        // The cleanup function is crucial. Let's log when it runs.
        return () => {
            console.log(`🧹 GameContainer useEffect CLEANUP running (ID: ${currentLoopId}). Phase was "${gamePhase}". Clearing timeout and animation frame.`);
            clearTimeout(timeoutId);
            cancelAnimationFrame(animationFrameId);
        };
    }, [gamePhase, gameTick, checkBossDefeat]); // The effect re-runs whenever the gamePhase changes.

    const renderGamePhase = () => {
        // Log when we are trying to render a phase
        console.log(`🎨 Rendering game phase: "${gamePhase}"`);
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
