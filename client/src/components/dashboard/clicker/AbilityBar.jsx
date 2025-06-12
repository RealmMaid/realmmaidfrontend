import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { abilities } from '../../../data/abilities';

export function AbilityBar() {
    // Get the specific state and actions this component needs from the store
    const {
        playerClass,
        abilityCooldowns,
        handleUseAbility,
        activeBuffs, // Needed for the Arcane Power logic
        poison,      // Needed for the Sorcerer logic
    } = useGameStore();

    // Find the ability that matches the player's class
    const playerAbility = abilities.find(a => a.classId === playerClass);

    // This local state will help us display a smooth countdown timer
    const [cooldownTimer, setCooldownTimer] = useState(0);

    useEffect(() => {
        if (!playerAbility) return;

        const timerInterval = setInterval(() => {
            const now = Date.now();
            const cdEnd = abilityCooldowns[playerAbility.id] || 0;
            setCooldownTimer(Math.max(0, Math.ceil((cdEnd - now) / 1000)));
        }, 500); // Update twice a second

        return () => clearInterval(timerInterval);
    }, [abilityCooldowns, playerAbility]);


    // The component doesn't render at all if there's no ability to show
    if (!playerAbility) {
        return null;
    }

    const onAbilityClick = () => {
        // We pass any extra local state the ability might need to the store action
        handleUseAbility(playerAbility.id, {
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
