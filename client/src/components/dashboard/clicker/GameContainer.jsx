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
import { NotificationManager } from './NotificationManager'; // ✨ NEW: Import the manager!

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
            gameTick(deltaTime);
            checkBossDefeat();
            animationFrameId = requestAnimationFrame(loop);
        };
        animationFrameId = requestAnimationFrame(loop);
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [gameTick, checkBossDefeat]);

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
            {/* ✨ NEW: Add the NotificationManager here! It's always active but invisible. */}
            <NotificationManager />
            <div className="clicker-container">
                {renderGamePhase()}
            </div>
        </div>
    );
}
