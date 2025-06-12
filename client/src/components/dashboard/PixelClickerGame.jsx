import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Toaster } from 'react-hot-toast';

// Step 1: We import all the small, single-purpose components we created.
import { Hud } from './clicker/Hud';
import { BossDisplay } from './clicker/BossDisplay';
import { AbilityBar } from './clicker/AbilityBar';
import { ShopArea } from './clicker/ShopArea';
import { WelcomeBackModal } from './clicker/WelcomeBackModal';
import { ClassSelection } from './clicker/ClassSelection';
import { Portal } from './clicker/Portal';
import { VictoryScreen } from './clicker/VictoryScreen';

// This is the main container for the active game screen.
function GameContainer() {
    // We get the functions and state needed for our game loops from the store.
    const {
        gamePhase,
        applyDps,
        applyPoison,
        checkForAchievementUnlocks,
        equippedWeapon,
        poison,
        setPoison,
        pointsPerSecond,
        currentBossIndex,
        activeBuffs
    } = useGameStore();
    
    // The core game loops (useEffects) live inside a React component.
    // This ensures they start and stop correctly when the component is shown or hidden.

    // DPS Loop
    useEffect(() => {
        if (gamePhase !== 'clicking') return;

        const bonuses = useGameStore.getState().calculateAchievementBonuses();
        let dps = pointsPerSecond;

        if (equippedWeapon === 'executioners_axe') dps *= 0.5;
        if (activeBuffs['arcane_power']) dps *= 2;
        
        const fameFromDps = Math.floor(dps * bonuses.fameMultiplier);

        const interval = setInterval(() => {
            applyDps(fameFromDps);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [gamePhase, pointsPerSecond, equippedWeapon, activeBuffs]);


    // Poison Damage Loop
    useEffect(() => {
        if (equippedWeapon !== 'stacking_vipers') {
            if (poison.stacks > 0) setPoison({ stacks: 0, lastApplied: null });
            return;
        }

        const poisonInterval = setInterval(() => {
            if (get().poison.stacks > 0) {
                if (Date.now() - get().poison.lastApplied > 3000) {
                    setPoison(p => ({ ...p, stacks: Math.max(0, p.stacks - 1) }));
                }
                applyPoison();
            }
        }, 1000);

        return () => clearInterval(poisonInterval);
    }, [equippedWeapon, poison]);

    // Achievement Checking Loop
    useEffect(() => {
        // This effect runs whenever a key stat changes to check for new achievements.
        checkForAchievementUnlocks();
    }, [
        useGameStore(state => state.totalClicks),
        useGameStore(state => state.totalFameEarned),
        useGameStore(state => state.bossesDefeated),
        useGameStore(state => state.hasPrestiged)
    ]);

    // This component renders the main layout of the game.
    return (
        <div className="card">
            <div className="clicker-container">
                <Hud />
                
                {/* Conditionally render game phases */}
                {gamePhase === 'finished' && <VictoryScreen />}
                {gamePhase === 'portal' && <Portal />}

                {(gamePhase === 'clicking' || gamePhase === 'transitioning' || gamePhase === 'exalted_transition') && (
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
            <Toaster position="top-right" reverseOrder={false} />
            <WelcomeBackModal />
            
            {playerClass ? <GameContainer /> : <ClassSelection />}
        </>
    );
}

export default PixelClickerGame;
