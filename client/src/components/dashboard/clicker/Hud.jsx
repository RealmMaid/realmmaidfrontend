import React from 'react';
import { useGameStore } from '../../../stores/gameStore';

// ✨ The "export" keyword here makes this a NAMED EXPORT.
export function Hud() {
    // This component subscribes to the exact pieces of state it needs.
    const { score, exaltedShards, isMuted, toggleMute } = useGameStore(state => ({
        score: state.score,
        exaltedShards: state.exaltedShards,
        isMuted: state.isMuted,
        toggleMute: state.toggleMute,
    }));

    // This log will tell us what score the HUD is receiving when it renders.
    console.log(`%cHud Component: Rendering with score: ${score}`, 'color: #87ceeb');

    return (
        <>
            <div className="game-hud">
                <button onClick={toggleMute} className="btn-mute">
                    {isMuted ? '🔇' : '🔊'}
                </button>
            </div>

            <div className="stats-display">
                <h2>{Math.floor(score).toLocaleString()} Fame</h2>
                <p style={{ color: '#8a2be2', fontWeight: 'bold' }}>
                    {exaltedShards} Exalted Shards
                </p>
            </div>
        </>
    );
}
