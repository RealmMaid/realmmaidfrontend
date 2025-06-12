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
    } = useGameStore(state => ({
        gamePhase: state.gamePhase,
        currentBossIndex: state.currentBossIndex,
        clicksOnCurrentBoss: state.clicksOnCurrentBoss,
        pointsPerSecond: state.pointsPerSecond,
        isHealing: state.isHealing,
        triggeredHeals: state.triggeredHeals,
        poison: state.poison,
        equippedWeapon: state.equippedWeapon,
        setGamePhase: state.setGamePhase,
        advanceToNextBoss: state.advanceToNextBoss,
        applyDpsFame: state.applyDpsFame,
        setIsHealing: state.setIsHealing,
        applyHealing: state.applyHealing,
        setTriggeredHeal: state.setTriggeredHeal,
        setIsInvulnerable: state.setIsInvulnerable,
        checkForAchievementUnlocks: state.checkForAchievementUnlocks,
        applyPoisonDamage: state.applyPoisonDamage,
    }));

    const currentBoss = bosses[currentBossIndex];

    // === GAME LOGIC (useEffect Hooks) ===

    // 1. Core DPS Loop
    useEffect(() => {
        if (gamePhase !== 'clicking' || isHealing || pointsPerSecond <= 0) return;
        const interval = setInterval(() => {
            applyDpsFame(pointsPerSecond);
        }, 1000);
        return () => clearInterval(interval);
    }, [pointsPerSecond, gamePhase, isHealing, applyDpsFame]);

    // 2. Poison Damage Over Time Loop
    useEffect(() => {
        if (equippedWeapon !== 'stacking_vipers' || poison.stacks <= 0) return;
        const poisonInterval = setInterval(() => {
            const poisonDps = poison.stacks * (1 + Math.floor(currentBossIndex * 1.5));
            applyPoisonDamage(poisonDps);
        }, 1000);
        return () => clearInterval(poisonInterval);
    }, [equippedWeapon, poison.stacks, currentBossIndex, applyPoisonDamage]);

    // 3. Boss Defeat Watcher
    useEffect(() => {
        if (!currentBoss) return;
        if (clicksOnCurrentBoss >= currentBoss.clickThreshold && gamePhase === 'clicking') {
            useGameStore.getState().playSound(currentBoss.breakSound);
            if (currentBoss.id === 'oryx3') {
                setGamePhase('exalted_transition');
            } else if (currentBossIndex >= bosses.length - 1) {
                setGamePhase('finished');
                useGameStore.getState().setGameWon(true);
            } else {
                setGamePhase('transitioning');
            }
        }
    }, [clicksOnCurrentBoss, currentBossIndex, currentBoss, gamePhase, setGamePhase]);

    // 4. Phase Transition Timers
    useEffect(() => {
        let timer;
        if (gamePhase === 'transitioning') {
            timer = setTimeout(() => setGamePhase('portal'), 4000);
        } else if (gamePhase === 'exalted_transition') {
            timer = setTimeout(() => {
                advanceToNextBoss(false);
                setIsInvulnerable(true);
                const invulnerabilityTimer = setTimeout(() => {
                    setIsInvulnerable(false);
                    setGamePhase('clicking');
                }, 2000);
                return () => clearTimeout(invulnerabilityTimer);
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [gamePhase, setGamePhase, advanceToNextBoss, setIsInvulnerable]);

    // 5. Boss Healing Logic
    useEffect(() => {
        if (!currentBoss || !currentBoss.healThresholds || gamePhase !== 'clicking' || isHealing) return;
        const currentHealthPercent = 100 - (clicksOnCurrentBoss / currentBoss.clickThreshold) * 100;
        const triggeredHealsForBoss = triggeredHeals[currentBoss.id] || [];
        for (const heal of currentBoss.healThresholds) {
            if (currentHealthPercent <= heal.percent && !triggeredHealsForBoss.includes(heal.percent)) {
                setTriggeredHeal(currentBoss.id, heal.percent);
                setIsHealing(true);
                let amountHealed = 0;
                const healInterval = setInterval(() => {
                    const healThisTick = Math.min(2500, heal.amount - amountHealed);
                    amountHealed += healThisTick;
                    applyHealing(healThisTick);
                    if (amountHealed >= heal.amount) {
                        clearInterval(healInterval);
                        setIsHealing(false);
                    }
                }, 200);
                return () => clearInterval(healInterval);
            }
        }
    }, [clicksOnCurrentBoss, currentBossIndex, gamePhase, isHealing, triggeredHeals, currentBoss, setTriggeredHeal, setIsHealing, applyHealing]);
    
    // 6. Achievement Checker (runs on every click)
    useEffect(() => {
        checkForAchievementUnlocks();
    }, [clicksOnCurrentBoss, checkForAchievementUnlocks]);


    // === RENDER LOGIC ===
    if (!currentBoss && gamePhase !== 'finished') {
        return <div className="card"><p>Loading game...</p></div>;
    }
    
    if (gamePhase === 'finished') {
        return <VictoryScreen />;
    }

    if (gamePhase === 'portal') {
        return <Portal />;
    }

    if (gamePhase === 'transitioning' || gamePhase === 'exalted_transition') {
        return <TransitionalScreen />;
    }
    
    // Default render for the 'clicking' phase
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
