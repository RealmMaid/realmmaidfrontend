import React from 'react';
import { useGameStore } from '../../../stores/gameStore.jsx';

export function Hud() {
    // Select each piece of state individually
    const score = useGameStore(state => state.score);
    const exaltedShards = useGameStore(state => state.exaltedShards);
    const isMuted = useGameStore(state => state.isMuted);
    const toggleMute = useGameStore(state => state.toggleMute);

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