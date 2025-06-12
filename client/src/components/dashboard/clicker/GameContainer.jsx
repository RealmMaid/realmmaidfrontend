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
    // Select state needed for the component's top-level render logic.
    const gamePhase = useGameStore(state => state.gamePhase);

    // This single useEffect runs ONCE on mount and sets up the master game loop.
    useEffect(() => {
        const gameTickInterval = setInterval(() => {
            // Get the FRESHEST state directly from the store inside the loop.
            const state = useGameStore.getState();
            const currentBoss = bosses[state.currentBossIndex];

            // If there's no boss or the game isn't in the clicking phase, do nothing.
            if (!currentBoss || state.gamePhase !== 'clicking') {
                return;
            }
            
            // --- Boss Defeat Check ---
            // This now runs safely inside the master loop.
            if (state.clicksOnCurrentBoss >= currentBoss.clickThreshold) {
                state.playSound(currentBoss.breakSound);
                if (currentBoss.id === 'oryx3') {
                    state.setGamePhase('exalted_transition');
                } else if (state.currentBossIndex >= bosses.length - 1) {
                    state.setGameWon(true);
                    state.setGamePhase('finished');
                } else {
                    state.setGamePhase('transitioning');
                }
                return; // Stop further processing this tick since a phase change happened.
            }
            
            // --- Boss Healing Check ---
            // This also runs safely inside the master loop.
            if (!state.isHealing && currentBoss.healThresholds) {
                const healthPercent = 100 - (state.clicksOnCurrentBoss / currentBoss.clickThreshold) * 100;
                const triggered = state.triggeredHeals[currentBoss.id] || [];

                for (const heal of currentBoss.healThresholds) {
                    if (healthPercent <= heal.percent && !triggered.includes(heal.percent)) {
                        state.setTriggeredHeal(currentBoss.id, heal.percent);
                        state.setIsHealing(true);
                        
                        let amountHealed = 0;
                        const healInterval = setInterval(() => {
                            const healThisTick = Math.min(2500, heal.amount - amountHealed);
                            amountHealed += healThisTick;
                            // Use a separate getState call inside this async interval to ensure freshness
                            useGameStore.getState().applyHealing(healThisTick);
                            if (amountHealed >= heal.amount) {
                                clearInterval(healInterval);
                                useGameStore.getState().setIsHealing(false);
                            }
                        }, 200);
                        break; 
                    }
                }
            }

            // --- DPS and Poison Logic (only runs if not healing) ---
            if (!state.isHealing) {
                if (state.pointsPerSecond > 0) {
                    state.applyDpsFame(state.pointsPerSecond);
                }
                if (state.equippedWeapon === 'stacking_vipers' && state.poison.stacks > 0) {
                    const poisonDps = state.poison.stacks * (1 + Math.floor(state.currentBossIndex * 1.5));
                    state.applyPoisonDamage(poisonDps);
                    if (Date.now() - state.poison.lastApplied > 3000) {
                        state.setPoison({ ...state.poison, stacks: Math.max(0, state.poison.stacks - 1) });
                    }
                }
            }
        }, 1000); // The master game tick runs every second.

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(gameTickInterval);
    }, []); // The empty `[]` ensures this setup runs only ONCE, preventing loops.

    // This separate useEffect ONLY handles the timed transitions between phases. It is safe.
    useEffect(() => {
        let timer;
        const { setGamePhase, advanceToNextBoss, setIsInvulnerable } = useGameStore.getState();
        if (gamePhase === 'transitioning' || gamePhase === 'exalted_transition') {
            const duration = gamePhase === 'transitioning' ? 4000 : 3000;
            timer = setTimeout(() => {
                if (gamePhase === 'transitioning') {
                    setGamePhase('portal');
                } else if (gamePhase === 'exalted_transition') {
                    advanceToNextBoss(false);
                    setIsInvulnerable(true);
                    const invulnTimer = setTimeout(() => setIsInvulnerable(false), 2000);
                    setGamePhase('clicking');
                    return () => clearTimeout(invulnTimer);
                }
            }, duration);
        }
        return () => clearTimeout(timer);
    }, [gamePhase]);

    // === RENDER LOGIC ===
    const currentBossForRender = bosses[useGameStore(state => state.currentBossIndex)];
    if (!currentBossForRender && gamePhase !== 'finished') {
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
