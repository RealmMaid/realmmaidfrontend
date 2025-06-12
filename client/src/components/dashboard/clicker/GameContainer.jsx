import React, { useEffect } from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { bosses } from '../../../data/bosses';

// Import all the child components this container will render
import { Hud } from './Hud';
import { BossDisplay } from './BossDisplay';
import { AbilityBar } from './AbilityBar';
import { ShopArea } from './ShopArea';
import { Portal } from './Portal';
import { VictoryScreen } from './VictoryScreen';
import { TransitionalScreen } from './TransitionalScreen';

export function GameContainer() {
    // This component's logic remains the same.
    const { gamePhase, currentBossIndex } = useGameStore(state => ({
        gamePhase: state.gamePhase,
        currentBossIndex: state.currentBossIndex,
    }));
    const currentBoss = bosses[currentBossIndex];
    
    // All of your useEffect game loops would be here...

    // The only change is adding a `style` attribute to the outermost div below.

    if (!currentBoss && gamePhase !== 'finished') {
        return <div className="card"><p>Loading game...</p></div>;
    }
    
    if (gamePhase === 'finished') return <VictoryScreen />;
    if (gamePhase === 'portal') return <Portal />;
    if (gamePhase === 'transitioning' || gamePhase === 'exalted_transition') return <TransitionalScreen />;
    
    return (
        <div 
            className="card"
            style={{
                border: '10px solid limegreen',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                minHeight: '500px',
                width: '100%',
                color: 'white',
                padding: '20px',
                textAlign: 'center'
            }}
        >
            <h1>If you see this, the GameContainer is rendering!</h1>
            <p>The problem is the CSS of the components below.</p>
            <hr style={{margin: '1rem 0'}} />
            <div className="clicker-container">
                <Hud />
                <BossDisplay />
                <AbilityBar />
                <ShopArea />
            </div>
        </div>
    );
}
