import React, { useEffect, useRef } from 'react';
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
    // === STATE & ACTIONS ===
    // Select all the state and actions needed for the container's logic
    const {
        gamePhase,
        currentBossIndex,
        clicksOnCurrentBoss,
        pointsPerSecond,
        poison,
        equippedWeapon,
        setGamePhase,
        advanceToNextBoss,
        applyDpsFame,
        applyPoisonDamage,
    } = useGameStore(state => ({
        gamePhase: state.gamePhase,
        currentBossIndex: state.currentBossIndex,
        clicksOnCurrentBoss: state.clicksOnCurrentBoss,
        pointsPerSecond: state.pointsPerSecond,
        poison: state.poison,
        equippedWeapon: state.equippedWeapon,
        setGamePhase: state.setGamePhase,
        advanceToNextBoss: state.advanceToNextBoss,
        applyDpsFame: state.applyDpsFame,
        applyPoisonDamage: state.applyPoisonDamage,
    }));

    const currentBoss = bosses[currentBossIndex];

    // === GAME LOOPS & LOGIC (useEffect) ===

    // 1. Core DPS Loop (using accurate requestAnimationFrame)
    const dpsLoopId = useRef();
    const lastDpsTick = useRef(performance.now());
    useEffect(() => {
        const tick = (now) => {
            const delta = now - lastDpsTick.current;
            if (delta >= 1000) { // Apply DPS roughly every second
                const secondsPassed = delta / 1000;
                applyDpsFame(pointsPerSecond * secondsPassed);
                lastDpsTick.current = now;
            }
            dpsLoopId.current = requestAnimationFrame(tick);
        };

        if (pointsPerSecond > 0 && gamePhase === 'clicking') {
            dpsLoopId.current = requestAnimationFrame(tick);
        }

        return () => {
            if (dpsLoopId.current) {
                cancelAnimationFrame(dpsLoopId.current);
            }
        };
    }, [pointsPerSecond, gamePhase, applyDpsFame]);

    // 2. Boss Defeat Watcher
    useEffect(() => {
        if (currentBoss && clicksOnCurrentBoss >= currentBoss.clickThreshold && gamePhase === 'clicking') {
            if (currentBoss.id === 'oryx3') { // Special transition for final boss form
                setGamePhase('exalted_transition');
            } else if (currentBossIndex === bosses.length - 1) { // Final boss of the game
                setGamePhase('finished');
            } else { // Normal boss defeat
                setGamePhase('transitioning');
            }
        }
    }, [clicksOnCurrentBoss, currentBossIndex, currentBoss, gamePhase, setGamePhase]);

    // 3. Phase Transition Timers
    useEffect(() => {
        let timer;
        if (gamePhase === 'transitioning') {
            timer = setTimeout(() => setGamePhase('portal'), 4000); // 4-second fade out
        } else if (gamePhase === 'exalted_transition') {
            timer = setTimeout(() => {
                advanceToNextBoss(false);
                setGamePhase('clicking'); // Or a new phase for invulnerability if you wish
            }, 3000); // 3-second transition
        }
        return () => clearTimeout(timer);
    }, [gamePhase, setGamePhase, advanceToNextBoss]);
    
    // 4. Poison Damage Over Time Loop
    useEffect(() => {
        if (equippedWeapon !== 'stacking_vipers' || poison.stacks <= 0) {
            return;
        }
        const poisonInterval = setInterval(() => {
            const poisonDps = poison.stacks * (1 + Math.floor(currentBossIndex * 1.5));
            applyPoisonDamage(poisonDps);
        }, 1000);
        return () => clearInterval(poisonInterval);
    }, [equippedWeapon, poison.stacks, currentBossIndex, applyPoisonDamage]);


    // === RENDER LOGIC ===
    // Render different screens based on the current gamePhase

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
