import React from 'react';
import { useGameStore } from '../../../stores/gameStore.jsx';

/**
 * Hud Component (Heads-Up Display)
 * This component shows the player's core stats like Fame, Shards,
 * and now includes the calculated Fame Per Second and Damage Per Second!
 */
export function Hud() {
    // Select each piece of state individually for performance.
    // Zustand will only re-render this component if these specific values change.
    const score = useGameStore(state => state.score);
    const exaltedShards = useGameStore(state => state.exaltedShards);
    const famePerSecond = useGameStore(state => state.famePerSecond);
    const pointsPerSecond = useGameStore(state => state.pointsPerSecond);
    const isMuted = useGameStore(state => state.isMuted);
    const toggleMute = useGameStore(state => state.toggleMute);

    return (
        <>
            <div className="game-hud">
                <button onClick={toggleMute} className="btn-mute">
                    {isMuted ? '🔇' : '🔊'}
                </button>
            </div>
            <div className="stats-display" style={{ textAlign: 'center' }}>
                {/* Main Fame display */}
                <h2>{Math.floor(score).toLocaleString()} Fame</h2>
                
                {/* Conditional display for Fame Per Second */}
                {famePerSecond > 0 && (
                    <p style={{ color: '#aaffaa', margin: 0, fontSize: '0.9em' }}>
                        +{famePerSecond.toLocaleString(undefined, { maximumFractionDigits: 1 })} Fame/s 💸
                    </p>
                )}

                {/* Conditional display for Damage Per Second */}
                {pointsPerSecond > 0 && (
                     <p style={{ color: '#ffaaaa', margin: 0, fontSize: '0.9em' }}>
                        {pointsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 1 })} DPS ⚔️
                    </p>
                )}

                {/* Exalted Shards display */}
                <p style={{ color: '#8a2be2', fontWeight: 'bold', marginTop: '10px' }}>
                    {exaltedShards.toLocaleString()} Exalted Shards
                </p>
            </div>
        </>
    );
}
