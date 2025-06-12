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
    // Select state needed for TOP-LEVEL render logic ONLY.
    const { gamePhase, currentBossIndex } = useGameStore(state => ({
        gamePhase: state.gamePhase,
        currentBossIndex: state.currentBossIndex,
    }));

    const currentBoss = bosses[currentBossIndex];

    // This single useEffect runs ONCE when the component mounts.
    // It sets up a "game tick" that handles all time-based logic internally.
    useEffect(() => {
        const gameTickInterval = setInterval(() => {
            // Get the FRESHEST state directly from the store inside the loop.
            // This is the key to preventing infinite re-renders.
            const state = useGameStore.getState();

            // --- DPS Logic ---
            if (state.gamePhase === 'clicking' && !state.isHealing && state.pointsPerSecond > 0) {
                state.applyDpsFame(state.pointsPerSecond);
            }

            // --- Poison Logic ---
            if (state.equippedWeapon === 'stacking_vipers' && state.poison.stacks > 0) {
                const poisonDps = state.poison.stacks * (1 + Math.floor(state.currentBossIndex * 1.5));
                state.applyPoisonDamage(poisonDps);
                if (Date.now() - state.poison.lastApplied > 3000) {
                    state.setPoison({ ...state.poison, stacks: Math.max(0, state.poison.stacks - 1) });
                }
            }
            
            // --- Boss Healing Logic ---
            const bossForHealing = bosses[state.currentBossIndex];
            if (bossForHealing && bossForHealing.healThresholds && state.gamePhase === 'clicking' && !state.isHealing) {
                const healthPercent = 100 - (state.clicksOnCurrentBoss / bossForHealing.clickThreshold) * 100;
                const triggered = state.triggeredHeals[bossForHealing.id] || [];
                for (const heal of bossForHealing.healThresholds) {
                    if (healthPercent <= heal.percent && !triggered.includes(heal.percent)) {
                        state.setTriggeredHeal(bossForHealing.id, heal.percent);
                        state.setIsHealing(true); // This will pause other logic that checks for isHealing
                        
                        let amountHealed = 0;
                        const healInterval = setInterval(() => {
                            const healThisTick = Math.min(2500, heal.amount - amountHealed);
                            amountHealed += healThisTick;
                            useGameStore.getState().applyHealing(healThisTick);
                            if (amountHealed >= heal.amount) {
                                clearInterval(healInterval);
                                useGameStore.getState().setIsHealing(false);
                            }
                        }, 200);
                        break; // Only trigger one heal at a time
                    }
                }
            }

        }, 1000); // The master game tick runs every second.

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(gameTickInterval);
    }, []); // The empty `[]` dependency array ensures this setup runs only ONCE.

    
    // This separate useEffect handles BOSS DEFEAT logic.
    // It runs ONLY when the number of clicks changes.
    useEffect(() => {
        const boss = bosses[currentBossIndex];
        const { setGamePhase, setGameWon, playSound } = useGameStore.getState();
        if (boss && useGameStore.getState().clicksOnCurrentBoss >= boss.clickThreshold && useGameStore.getState().gamePhase === 'clicking') {
            playSound(boss.breakSound);
            if (boss.id === 'oryx3') {
                setGamePhase('exalted_transition');
            } else if (currentBossIndex >= bosses.length - 1) {
                setGameWon(true);
                setGamePhase('finished');
            } else {
                setGamePhase('transitioning');
            }
        }
    }, [useGameStore(state => state.clicksOnCurrentBoss), currentBossIndex]);


    // This useEffect handles the timed transitions between game phases.
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
