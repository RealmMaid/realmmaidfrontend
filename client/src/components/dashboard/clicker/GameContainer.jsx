import React, { useEffect } from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { bosses } from '../../../data/bosses';

// Import all the child components this container will render
import { Hud } from './Hud';
import { BossDisplay } from './BossDisplay';
import { AbilityBar } from './AbilityBar';
import { ShopArea } from './ShopArea';
import { Portal } from './Portal';
import { VictoryScreen } from './VictoryScreen';
import { TransitionalScreen } from './TransitionalScreen';

export function GameContainer() {
    // === STATE & ACTIONS from ZUSTAND ===
    // We only select state that is needed for RENDER logic here.
    // Logic inside loops will get fresh state directly from the store.
    const { gamePhase, currentBossIndex } = useGameStore(state => ({
        gamePhase: state.gamePhase,
        currentBossIndex: state.currentBossIndex,
    }));

    const currentBoss = bosses[currentBossIndex];

    // === GAME LOGIC (useEffect Hooks) ===

    // This single, stable useEffect runs once on mount and handles all time-based game loops.
    useEffect(() => {
        const gameTickInterval = setInterval(() => {
            // Get the latest state directly inside the loop.
            // This prevents the useEffect from needing dependencies that cause infinite loops.
            const {
                gamePhase,
                isHealing,
                pointsPerSecond,
                applyDpsFame,
                equippedWeapon,
                poison,
                setPoison,
                currentBossIndex,
                applyPoisonDamage,
                checkForAchievementUnlocks,
            } = useGameStore.getState();

            // 1. Core DPS Logic
            if (gamePhase === 'clicking' && !isHealing && pointsPerSecond > 0) {
                applyDpsFame(pointsPerSecond);
            }

            // 2. Poison Logic (Safe from infinite loops)
            if (equippedWeapon === 'stacking_vipers' && poison.stacks > 0) {
                // Apply damage
                const poisonDps = poison.stacks * (1 + Math.floor(currentBossIndex * 1.5));
                applyPoisonDamage(poisonDps);
                // Decay stacks
                if (Date.now() - poison.lastApplied > 3000) {
                    setPoison({ ...poison, stacks: Math.max(0, poison.stacks - 1) });
                }
            }

            // 3. Achievement Check (can be run periodically)
            checkForAchievementUnlocks();

        }, 1000); // This single "game tick" runs every second.

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(gameTickInterval);
    }, []); // The empty dependency array `[]` is KEY. It ensures this effect runs only ONCE.

    // This separate useEffect handles logic that should ONLY run when a specific value changes.
    useEffect(() => {
        const { gamePhase, setGamePhase, clicksOnCurrentBoss, advanceToNextBoss, setGameWon } = useGameStore.getState();
        const boss = bosses[currentBossIndex];
        if (boss && clicksOnCurrentBoss >= boss.clickThreshold && gamePhase === 'clicking') {
            useGameStore.getState().playSound(boss.breakSound);
            if (boss.id === 'oryx3') {
                setGamePhase('exalted_transition');
            } else if (currentBossIndex >= bosses.length - 1) {
                setGameWon(true);
                setGamePhase('finished');
            } else {
                setGamePhase('transitioning');
            }
        }
    }, [useGameStore(state => state.clicksOnCurrentBoss)]); // This effect now ONLY watches for clicks.

    // This useEffect handles the timed transitions between phases.
    useEffect(() => {
        let timer;
        const { setGamePhase, advanceToNextBoss, setIsInvulnerable } = useGameStore.getState();
        if (gamePhase === 'transitioning') {
            timer = setTimeout(() => setGamePhase('portal'), 4000);
        } else if (gamePhase === 'exalted_transition') {
            timer = setTimeout(() => {
                advanceToNextBoss(false);
                setIsInvulnerable(true);
                const invulnTimer = setTimeout(() => setIsInvulnerable(false), 2000);
                setGamePhase('clicking');
                return () => clearTimeout(invulnTimer);
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [gamePhase]);

    // The logic for boss healing can also be managed safely in its own effect
    useEffect(() => {
         const { gamePhase, isHealing, clicksOnCurrentBoss, triggeredHeals, setIsHealing, applyHealing, setTriggeredHeal } = useGameStore.getState();
         const boss = bosses[currentBossIndex];
         if (!boss || !boss.healThresholds || gamePhase !== 'clicking' || isHealing) return;
         const currentHealthPercent = 100 - (clicksOnCurrentBoss / boss.clickThreshold) * 100;
         const triggered = triggeredHeals[boss.id] || [];
         for (const heal of boss.healThresholds) {
             if (currentHealthPercent <= heal.percent && !triggered.includes(heal.percent)) {
                setTriggeredHeal(boss.id, heal.percent);
                setIsHealing(true);
                // ... rest of healing logic ...
             }
         }
    }, [useGameStore(state => state.clicksOnCurrentBoss)]);


    // === RENDER LOGIC ===
    if (!currentBoss && gamePhase !== 'finished') {
        return <div className="card"><p>Loading game...</p></div>;
    }
    
    if (gamePhase === 'finished') return <VictoryScreen />;
    if (gamePhase === 'portal') return <Portal />;
    if (gamePhase === 'transitioning' || gamePhase === 'exalted_transition') return <TransitionalScreen />;
    
    return (
        <div className="card">
            <div className="clicker-container">
                <Hud />
                <BossDisplay />
                <AbilityBar />
                <ShopArea />
            </div>
        </div>
    );
}
