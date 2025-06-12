import React from 'react';
import { useGameStore } from '../../../stores/gameStore.jsx';
import { bosses } from '../../../data/bosses.js';

export function Portal() {
    // Get DATA from the store
    const currentBossIndex = useGameStore(state => state.currentBossIndex);

    const previousBoss = bosses[currentBossIndex - 1];

    if (!previousBoss || !previousBoss.portalImage) {
        return <div>Loading next area...</div>;
    }

    return (
        <div className="portal-prompt">
            <img src={previousBoss.portalImage} alt="A mysterious portal" className="portal-image" />
            <h4>A portal has opened! Do you enter?</h4>
            <button onClick={() => useGameStore.getState().handleEnterPortal()}>Enter!~</button>
        </div>
    );
}
