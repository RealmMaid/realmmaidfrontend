import React from 'react';
import { useGameStore } from '../../../stores/gameStore'; // We need this for the new logic

// --- UI Component Imports ---
import { Hud } from './Hud';
import { ShopArea } from './ShopArea';
import { AbilityBar } from './AbilityBar';
import { BossDisplay } from './BossDisplay'; // We've added the boss back!
import { ClassSelection } from './ClassSelection'; // For the start of the game
import { TransitionalScreen } from './TransitionalScreen'; // For between bosses
import { VictoryScreen } from './VictoryScreen'; // For when you win!

/**
 * GameContainer Component
 * This is the main controller for the clicker game's UI.
 * It reads the `gamePhase` from the store and decides which major UI screen to show.
 * This keeps the logic clean and in one place!
 */
export function GameContainer() {
    // We only need one piece of state here: the gamePhase!
    const gamePhase = useGameStore(state => state.gamePhase);

    // This function decides what to render based on the current game phase
    const renderGamePhase = () => {
        switch (gamePhase) {
            case 'classSelection':
                return <ClassSelection />;

            case 'clicking':
                // This is the main game view!
                return (
                    <>
                        <Hud />
                        <hr style={{ margin: '1rem 0' }} />
                        <div className="boss-display-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                           <BossDisplay /> {/* The boss is here now! Yay! */}
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
                // As a fallback, just show the class selection
                return <ClassSelection />;
        }
    };

    return (
        <div className="card">
            <div className="clicker-container">
                {/* We call our new function to render the correct view */}
                {renderGamePhase()}
            </div>
        </div>
    );
}
