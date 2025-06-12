import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../stores/gameStore.jsx';
import { abilities } from '../../../data/abilities.js';

export function AbilityBar() {
    // This component can safely use a single selector because the result is memoized
    // by Zustand if the underlying values haven't changed. But for consistency, let's separate.
    const playerClass = useGameStore(state => state.playerClass);
    const abilityCooldowns = useGameStore(state => state.abilityCooldowns);
    const activeBuffs = useGameStore(state => state.activeBuffs);
    const poison = useGameStore(state => state.poison);

    const playerAbility = abilities.find(a => a.classId === playerClass);
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

    if (!playerAbility) return null;

    const onAbilityClick = () => {
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