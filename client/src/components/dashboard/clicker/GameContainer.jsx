import React, { useEffect } from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { bosses } from '../../../data/bosses';

// ... (your other component imports like Hud, BossDisplay, etc.)

export function GameContainer() {
    const gameState = useGameStore(); // Get the entire state object for logging

    // [DEBUGGING LOG] This will print the entire game state to the console
    // when this component tries to render.
    console.log('--- GAME STATE IN CONTAINER ---', gameState);

    const {
        gamePhase,
        currentBossIndex,
        clicksOnCurrentBoss,
        pointsPerSecond,
        isHealing,
        triggeredHeals,
        poison,
        equippedWeapon,
        setGamePhase,
        advanceToNextBoss,
        applyDpsFame,
        setIsHealing,
        applyHealing,
        setTriggeredHeal,
        setIsInvulnerable,
        checkForAchievementUnlocks,
        applyPoisonDamage,
    } = gameState;

    const currentBoss = bosses[currentBossIndex];
    
    // --- All your useEffect hooks for game logic go here ---
    // (Core DPS Loop, Poison Loop, Boss Defeat Watcher, etc.)
    // For brevity, I've omitted them, but they should be the same as the
    // complete version I sent you previously. The only change is adding
    // the console.log above.

    // ... your useEffects ...

    // === RENDER LOGIC ===
    if (!currentBoss && gamePhase !== 'finished') {
        return <div className="card"><p>Loading game...</p></div>;
    }
    
    // ... the rest of your render logic (if/else for gamePhase) ...
}
