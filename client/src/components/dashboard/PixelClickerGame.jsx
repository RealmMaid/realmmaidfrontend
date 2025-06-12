import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import toast, { Toaster } from 'react-hot-toast';

// Step 1: We import all the small, single-purpose components we just created.
import { Hud } from './clicker/Hud';
import { BossDisplay } from './clicker/BossDisplay';
import { AbilityBar } from './clicker/AbilityBar';
import { ShopArea } from './clicker/ShopArea';
import { WelcomeBackModal } from './clicker/WelcomeBackModal';
import { ClassSelection } from './clicker/ClassSelection';
import { Portal } from './clicker/Portal';
import { VictoryScreen } from './clicker/VictoryScreen';
import { TransitionalScreen } from './clicker/TransitionalScreen';

// This is the main container for the active game screen.
function GameContainer() {
    // We get the functions and state needed for our game loops from the store.
    const {
        gamePhase,
        applyDpsFame,
        applyPoisonDamage,
        checkForAchievementUnlocks,
        equippedWeapon,
        setPoison,
        pointsPerSecond,
        activeBuffs,
        checkBossDefeat,
        checkBossHeal,
    } = useGameStore();
    
    // This is where the logic that MUST be tied to the component lifecycle lives.
    // These are our core game loops.

    // Main DPS Loop
    useEffect(() => {
        if (gamePhase !== 'clicking' && gamePhase !== 'exalted_transition' && !isInvulnerable) return;

        const { calculateAchievementBonuses } = useGameStore.getState();
        const bonuses = calculateAchievementBonuses();
        let dps = pointsPerSecond;

        if (equippedWeapon === 'executioners_axe') dps *= 0.5;
        if (activeBuffs['arcane_power']) dps *= 2;
        
        const fameFromDps = Math.floor(dps * bonuses.fameMultiplier);
        if (fameFromDps <= 0) return;

        const interval = setInterval(() => {
            applyDpsFame(fameFromDps);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [gamePhase, pointsPerSecond, equippedWeapon, activeBuffs]);

    // Poison Damage Loop
    useEffect(() => {
        if (equippedWeapon !== 'stacking_vipers') {
            setPoison({ stacks: 0, lastApplied: null });
            return;
        }

        const poisonInterval = setInterval(() => {
            const { poison, currentBossIndex } = useGameStore.getState();
            if (poison.stacks > 0) {
                if (Date.now() - poison.lastApplied > 3000) {
                    setPoison({ ...poison, stacks: Math.max(0, poison.stacks - 1) });
                }
                const poisonDps = poison.stacks * (1 + Math.floor(currentBossIndex * 1.5));
                applyPoisonDamage(poisonDps);
            }
        }, 1000);

        return () => clearInterval(poisonInterval);
    }, [equippedWeapon]);

    // Check for achievements whenever key stats change.
    useEffect(() => {
        checkForAchievementUnlocks();
    }, [
        useGameStore(state => state.totalClicks),
        useGameStore(state => state.totalFameEarned),
        useGameStore(state => state.bossesDefeated),
        useGameStore(state => state.hasPrestiged)
    ]);
    
    // Check for boss defeat and healing conditions
    useEffect(() => {
        const unsubscribe = useGameStore.subscribe(
            (state, prevState) => {
                if (state.clicksOnCurrentBoss !== prevState.clicksOnCurrentBoss) {
                    checkBossDefeat();
                    checkBossHeal();
                }
            }
        );
        return unsubscribe;
    }, []);


    return (
        <div className="card">
            <div className="clicker-container">
                <Hud />
                
                {/* Conditionally render game phases */}
                {gamePhase === 'finished' && <VictoryScreen />}
                {gamePhase === 'portal' && <Portal />}
                {(gamePhase === 'transitioning' || gamePhase === 'exalted_transition') && <TransitionalScreen />}

                {gamePhase === 'clicking' && (
                    <>
                        <BossDisplay />
                        <AbilityBar />
                        <ShopArea />
                    </>
                )}
            </div>
        </div>
    );
}

// This is now the main component exported by this file.
// Its only job is to decide whether to show the Class Selection screen
// or the main Game Container.
function PixelClickerGame() {
    const playerClass = useGameStore(state => state.playerClass);
    
    return (
        <>
            <Toaster position="top-right" />
            <WelcomeBackModal />
            
            {playerClass ? <GameContainer /> : <ClassSelection />}
        </>
    );
}

export default PixelClickerGame;
