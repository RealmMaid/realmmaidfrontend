import React, { useEffect } from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { bosses } from '../../../data/bosses';

// Import the child components
import { Hud } from './Hud';
import { BossDisplay } from './BossDisplay';
import { AbilityBar } from './AbilityBar';
import { ShopArea } from './ShopArea';
import { Portal } from './Portal';
import { VictoryScreen } from './VictoryScreen';
import { TransitionalScreen } from './TransitionalScreen';

export function GameContainer() {
    // We only select `gamePhase` for rendering. This means this component will NOT re-render
    // every time the score or clicks change, which helps prevent loops.
    const gamePhase = useGameStore(state => state.gamePhase);

    // This is the MASTER GAME LOOP.
    // It runs only ONCE when the component mounts because its dependency array `[]` is empty.
    useEffect(() => {
        // We set up an interval that runs every second to act as our "game tick".
        const gameTickInterval = setInterval(() => {
            // Inside the tick, we get the FRESHEST state directly from the store.
            // This is the key to preventing loops, as this effect doesn't "depend" on state.
            const state = useGameStore.getState();
            const currentBoss = bosses[state.currentBossIndex];

            // If the game isn't in the active "clicking" phase, we don't need to run game logic.
            if (state.gamePhase !== 'clicking' || !currentBoss) {
                return;
            }
            
            // --- All game logic now runs safely inside this tick ---

            // 1. Check for Boss Defeat first
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
                return; // Stop this tick, as a phase change has occurred.
            }
            
            // 2. Check for Boss Healing
            if (!state.isHealing && currentBoss.healThresholds) {
                const healthPercent = 100 - (state.clicksOnCurrentBoss / currentBoss.clickThreshold) * 100;
                const triggered = state.triggeredHeals[currentBoss.id] || [];

                for (const heal of currentBoss.healThresholds) {
                    if (healthPercent <= heal.percent && !triggered.includes(heal.percent)) {
                        state.setTriggeredHeal(currentBoss.id, heal.percent);
                        state.setIsHealing(true); // Set healing state
                        
                        let amountHealed = 0;
                        const healInterval = setInterval(() => {
                            const healThisTick = Math.min(2500, heal.amount - amountHealed);
                            amountHealed += healThisTick;
                            useGameStore.getState().applyHealing(healThisTick);
                            if (amountHealed >= heal.amount) {
                                clearInterval(healInterval);
                                useGameStore.getState().setIsHealing(false); // Unset healing state
                            }
                        }, 200);
                        break; 
                    }
                }
            }

            // 3. Apply DPS and Poison (only if not healing)
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

        }, 1000); // Master tick runs every 1000ms (1 second)

        // This is the cleanup function. It runs when the component unmounts to prevent memory leaks.
        return () => clearInterval(gameTickInterval);
    }, []); // The empty `[]` ensures this setup runs only ONCE.

    // This separate useEffect handles the timed transitions between phases. It is safe because
    // it only depends on `gamePhase`, which is not changed inside a rapid loop.
    useEffect(() => {
        let timer;
        const { setGamePhase, advanceToNextBoss, setIsInvulnerable } = useGameStore.getState();
        if (gamePhase === 'transitioning' || gamePhase === 'exalted_transition') {
            const duration = gamePhase === 'transitioning' ? 4000 : 3000;
            timer = setTimeout(() => {
                if (useGameStore.getState().gamePhase === 'transitioning') {
                    setGamePhase('portal');
                } else if (useGameStore.getState().gamePhase === 'exalted_transition') {
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
