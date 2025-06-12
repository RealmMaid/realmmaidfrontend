import React from 'react';
import { useGameStore } from '../../../stores/gameStore';

export function Hud() {
    // This component subscribes to the exact pieces of state it needs from our central store.
    // It will automatically re-render whenever these specific values change.
    const { score, exaltedShards, isMuted, toggleMute } = useGameStore(state => ({
        score: state.score,
        exaltedShards: state.exaltedShards,
        isMuted: state.isMuted,
        toggleMute: state.toggleMute,
    }));

    return (
        <>
            <div className="game-hud">
                <button onClick={toggleMute} className="btn-mute">
                    {isMuted ? '🔇' : '🔊'}
                </button>
            </div>

            <div className="stats-display">
                {/* This will display the score from the store, which gets updated by Phaser */}
                <h2>{Math.floor(score).toLocaleString()} Fame</h2>
                <p style={{ color: '#8a2be2', fontWeight: 'bold' }}>
                    {exaltedShards} Exalted Shards
                </p>
            </div>
        </>
    );
}
