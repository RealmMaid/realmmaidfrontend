import React from 'react'; // We can remove useEffect and useRef!
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
 * Its only job is to display the correct UI based on the gamePhase.
 * The game logic loop is now handled globally and safely by GameLoopManager.
 */
export function GameContainer() {
    const gamePhase = useGameStore(state => state.gamePhase);

    // The entire useEffect for the game loop has been removed!
    // No more race conditions or timing bugs from here. Yay!

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
