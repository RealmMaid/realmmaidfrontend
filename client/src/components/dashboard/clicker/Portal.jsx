import React from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { bosses } from '../../../data/bosses';

export function Portal() {
    // Get the current boss index to find the right portal image,
    // and the action to enter the portal.
    const { currentBossIndex, handleEnterPortal } = useGameStore(state => ({
        currentBossIndex: state.currentBossIndex,
        handleEnterPortal: state.handleEnterPortal,
    }));

    // We look at the *previous* boss to get the portal image they opened.
    const previousBoss = bosses[currentBossIndex - 1];

    if (!previousBoss || !previousBoss.portalImage) {
        // Fallback in case there's no portal image
        return <div>Loading next area...</div>;
    }

    return (
        <div className="portal-prompt">
            <img src={previousBoss.portalImage} alt="A mysterious portal" className="portal-image" />
            <h4>A portal has opened! Do you enter?</h4>
            <button onClick={handleEnterPortal}>Enter!~</button>
        </div>
    );
}
