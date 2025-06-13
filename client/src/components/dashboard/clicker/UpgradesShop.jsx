import React, { useMemo } from 'react';
import { useGameStore } from '../../../stores/gameStore.jsx';
import { classUpgrades } from '../../../data/classUpgrades.js';
import { bosses } from '../../../data/bosses.js';

export function UpgradesShop() {
    // Select data from the store
    const score = useGameStore(state => state.score);
    const isHealing = useGameStore(state => state.isHealing);
    const playerClass = useGameStore(state => state.playerClass);
    const currentBossId = useGameStore(state => state.currentBossId); // ✨ NEW
    const bossCycleIndex = useGameStore(state => state.bossCycleIndex); // ✨ NEW
    const upgradesOwned = useGameStore(state => state.upgradesOwned);
    const temporaryUpgradesOwned = useGameStore(state => state.temporaryUpgradesOwned);
    const handleBuyUpgrade = useGameStore(state => state.handleBuyUpgrade);
    const handleBuyTemporaryUpgrade = useGameStore(state => state.handleBuyTemporaryUpgrade);

    // ✨ UPDATED: Find the current boss object by ID
    const currentBoss = useMemo(() => bosses.find(b => b.id === currentBossId), [currentBossId]);
    
    // ✨ UPDated: Calculate the correct stage for permanent upgrades based on the cycle index
    const bossStage = `stage${Math.min(bossCycleIndex + 1, 3)}`;
    const currentClassUpgrades = classUpgrades[bossStage]?.[playerClass] || [];

    const calculateUpgradeCost = (upgrade) => {
        const owned = upgradesOwned[upgrade.id] || 0;
        return Math.floor(upgrade.cost * Math.pow(1.15, owned));
    };

    return (
        <>
            {/* ✨ UPDATED: Safely check for temporary upgrades on the current boss */}
            {currentBoss && currentBoss.temporaryUpgrades && (
                <div className="upgrades-shop temporary-shop">
                    <h4>Temporary Boosts</h4>
                    <div className="upgrades-grid">
                        {currentBoss.temporaryUpgrades.map(up => {
                            const owned = temporaryUpgradesOwned[up.id] || 0;
                            const cost = Math.floor(up.cost * Math.pow(1.25, owned));
                            return (
                                <button
                                    key={up.id}
                                    onClick={() => handleBuyTemporaryUpgrade(up)}
                                    className="btn-upgrade temporary"
                                    disabled={score < cost || isHealing}
                                >
                                    <span className="upgrade-name">{up.name}</span>
                                    <small>+{up.clickBonus.toLocaleString()} Click Damage</small>
                                    <small>Cost: {cost.toLocaleString()}</small>
                                    <small>(Owned: {owned})</small>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="upgrades-shop">
                <h4>{playerClass}'s Upgrades!~</h4>
                <div className="upgrades-grid">
                    {currentClassUpgrades.map(up => {
                        const cost = calculateUpgradeCost(up);
                        return (
                            <button
                                key={up.id}
                                onClick={() => handleBuyUpgrade(up)}
                                className="btn-upgrade"
                                disabled={score < cost || isHealing}
                            >
                                <img src={up.image} alt={up.name} className="upgrade-image" />
                                <span className="upgrade-name">{up.name}</span>
                                <small>Cost: {cost.toLocaleString()}</small>
                                <small>(Owned: {upgradesOwned[up.id] || 0})</small>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
