import React from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { classUpgrades } from '../../../data/classUpgrades';
import { bosses } from '../../../data/bosses';

export function UpgradesShop() {
    // Select all the state and actions we need for this component from the store
    const {
        score,
        isHealing,
        playerClass,
        currentBossIndex,
        upgradesOwned,
        temporaryUpgradesOwned,
        handleBuyUpgrade,
        handleBuyTemporaryUpgrade,
    } = useGameStore(state => ({
        score: state.score,
        isHealing: state.isHealing,
        playerClass: state.playerClass,
        currentBossIndex: state.currentBossIndex,
        upgradesOwned: state.upgradesOwned,
        temporaryUpgradesOwned: state.temporaryUpgradesOwned,
        handleBuyUpgrade: state.handleBuyUpgrade,
        handleBuyTemporaryUpgrade: state.handleBuyTemporaryUpgrade,
    }));

    const currentBoss = bosses[currentBossIndex];
    const bossStage = `stage${Math.min(currentBossIndex + 1, 3)}`;
    const currentClassUpgrades = classUpgrades[bossStage]?.[playerClass] || [];

    const calculateUpgradeCost = (upgrade) => {
        const owned = upgradesOwned[upgrade.id] || 0;
        return Math.floor(upgrade.cost * Math.pow(1.15, owned));
    };

    return (
        <>
            {/* Temporary Boosts Section */}
            {currentBoss.temporaryUpgrades && (
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

            {/* Permanent Class Upgrades Section */}
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
