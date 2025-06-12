import React from 'react';
import { useGameStore } from '../../../stores/gameStore';

export function Hud() {
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
                <h2>{Math.floor(score).toLocaleString()} Fame</h2>
                <p style={{ color: '#8a2be2', fontWeight: 'bold' }}>{exaltedShards} Exalted Shards</p>
            </div>
        </>
    );
}
