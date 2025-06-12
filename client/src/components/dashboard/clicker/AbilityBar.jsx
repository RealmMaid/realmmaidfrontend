import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../stores/gameStore.jsx';
import { abilities } from '../../../data/abilities.js';

export function AbilityBar() {
    // We still get DATA from the store using the hook
    const {
        playerClass,
        abilityCooldowns,
        activeBuffs,
        poison,
    } = useGameStore(state => ({
        playerClass: state.playerClass,
        abilityCooldowns: state.abilityCooldowns,
        activeBuffs: state.activeBuffs,
        poison: state.poison,
    }));

    // Find the ability that matches the player's class
    const playerAbility = abilities.find(a => a.classId === playerClass);

    // This local state helps us display a smooth countdown timer
    const [cooldownTimer, setCooldownTimer] = useState(0);

    useEffect(() => {
        if (!playerAbility) return;

        const timerInterval = setInterval(() => {
            const now = Date.now();
            const cdEnd = abilityCooldowns[playerAbility.id] || 0;
            setCooldownTimer(Math.max(0, Math.ceil((cdEnd - now) / 1000)));
        }, 500);

        return () => clearInterval(timerInterval);
    }, [abilityCooldowns, playerAbility]);

    if (!playerAbility) {
        return null;
    }

    const onAbilityClick = () => {
        // We call the ACTION directly from getState()
        useGameStore.getState().handleUseAbility(playerAbility.id, {
            activeBuffs,
            poison,
        });
    };

    return (
        <div className="ability-bar">
            <button
                className="ability-button"
                onClick={onAbilityClick}
                disabled={cooldownTimer > 0}
            >
                <div className="ability-info">
                    <strong>{playerAbility.name}</strong>
                    <small>{playerAbility.description}</small>
                </div>
                {cooldownTimer > 0 && (
                    <div className="cooldown-overlay">
                        <div className="cooldown-text">{cooldownTimer}s</div>
                    </div>
                )}
            </button>
        </div>
    );
}
