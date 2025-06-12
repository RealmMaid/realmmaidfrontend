import React from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { achievements } from '../../../data/achievements';

export function AchievementsList() {
    // This component only needs to know which achievements are unlocked.
    const unlockedAchievements = useGameStore(state => state.unlockedAchievements);

    return (
        <div className="upgrades-shop">
            <h4>Achievements</h4>
            <div className="achievements-grid">
                {achievements.map(ach => (
                    <div
                        key={ach.id}
                        className={`achievement-item ${unlockedAchievements[ach.id] ? 'unlocked' : ''}`}
                    >
                        <strong className="achievement-name">{ach.name}</strong>
                        <p className="achievement-desc">{ach.description}</p>
                        <p className="achievement-reward">
                            {unlockedAchievements[ach.id] ? ach.rewardDescription : '???'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
