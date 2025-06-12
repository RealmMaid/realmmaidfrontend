import React from 'react';
import { useGameStore } from '../../../stores/gameStore.jsx';
import { prestigeUpgrades } from '../../../data/prestigeUpgrades.js';
import { weapons } from '../../../data/weapons.js';

export function PrestigeShop() {
    // Get only the DATA needed from the store
    const {
        exaltedShards,
        isHealing,
        prestigeUpgradesOwned,
        unlockedWeapons,
    } = useGameStore(state => ({
        exaltedShards: state.exaltedShards,
        isHealing: state.isHealing,
        prestigeUpgradesOwned: state.prestigeUpgradesOwned,
        unlockedWeapons: state.unlockedWeapons,
    }));

    const calculatePrestigeUpgradeCost = (upgrade) => {
        const owned = prestigeUpgradesOwned[upgrade.id] || 0;
        return Math.floor(upgrade.cost * Math.pow(1.5, owned));
    };

    return (
        <div className="upgrades-shop">
            <h4 style={{ color: '#8a2be2' }}>Prestige Shop</h4>
            <div className="upgrades-grid">
                {prestigeUpgrades.map(up => {
                    const cost = calculatePrestigeUpgradeCost(up);
                    return (
                        <button
                            key={up.id}
                            onClick={() => useGameStore.getState().handleBuyPrestigeUpgrade(up)}
                            className="btn-upgrade prestige"
                            disabled={exaltedShards < cost || isHealing}
                        >
                            <span className="upgrade-name">{up.name}</span>
                            <small>{up.description}</small>
                            <small>Cost: {cost} Shards</small>
                            <small>(Level: {prestigeUpgradesOwned[up.id] || 0})</small>
                        </button>
                    );
                })}

                {weapons.map(w => (
                    !unlockedWeapons[w.id] && (
                        <button
                            key={`unlock-${w.id}`}
                            onClick={() => useGameStore.getState().handleUnlockWeapon(w)}
                            className="btn-upgrade weapon-unlock"
                            disabled={exaltedShards < w.cost || isHealing}
                        >
                            <span className="upgrade-name">Unlock: {w.name}</span>
                            <small>{w.description}</small>
                            <small>Cost: {w.cost} Shards</small>
                        </button>
                    )
                ))}
            </div>
        </div>
    );
}
