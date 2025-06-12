import React, { useState, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../../../stores/gameStore';
import { bosses } from '../../../data/bosses';
import toast from 'react-hot-toast';

/**
 * BossDisplay Component
 * This is the main interactive element of the game.
 */
export function BossDisplay() {
    // ✨ THE FIX: We select each piece of state individually.
    // This is a best practice with Zustand and prevents the component from
    // re-rendering unnecessarily when other parts of the store change (like the score).
    const gamePhase = useGameStore(state => state.gamePhase);
    const currentBossIndex = useGameStore(state => state.currentBossIndex);
    const clicksOnCurrentBoss = useGameStore(state => state.clicksOnCurrentBoss);
    const isHealing = useGameStore(state => state.isHealing);
    const isInvulnerable = useGameStore(state => state.isInvulnerable);
    const equippedWeapon = useGameStore(state => state.equippedWeapon);
    const poison = useGameStore(state => state.poison);
    const activeBuffs = useGameStore(state => state.activeBuffs);

    // We also select actions we need to call.
    const playSound = useGameStore(state => state.playSound);
    const calculateDamageRange = useGameStore(state => state.calculateDamageRange);
    const applyClick = useGameStore(state => state.applyClick);
    const setPoison = useGameStore(state => state.setPoison);

    // State for purely visual things is still managed locally.
    const [floatingNumbers, setFloatingNumbers] = useState([]);
    const [isShaking, setIsShaking] = useState(false);
    const gemButtonRef = useRef(null);

    // useMemo helps prevent recalculating the current boss on every render.
    const currentBoss = useMemo(() => bosses[currentBossIndex], [currentBossIndex]);

    const handleGemClick = (event) => {
        if (gamePhase !== 'clicking' || isHealing || isInvulnerable) return;

        playSound(currentBoss.clickSound, 0.5);
        let { minDamage, maxDamage } = calculateDamageRange();
        let damageDealt = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
        let fameEarned = damageDealt; // Base fame is equal to damage dealt

        // Apply weapon effects
        if (equippedWeapon === 'executioners_axe' && Math.random() < 0.10) {
            damageDealt *= 10;
            toast('CRITICAL HIT!', { icon: '💥', duration: 1000 });
        }
        if (equippedWeapon === 'golden_rapier') {
            fameEarned *= 1.25;
        }
        if (equippedWeapon === 'stacking_vipers') {
            setPoison({ stacks: poison.stacks + 1, lastApplied: Date.now() });
        }
        
        // Calculate final fame including achievement bonuses
        const bonuses = useGameStore.getState().calculateAchievementBonuses();
        fameEarned = Math.floor(fameEarned * bonuses.fameMultiplier);
        
        // Call the main action in the store to apply damage and fame
        applyClick(damageDealt, fameEarned);

        // Handle the visual feedback here in the component
        const rect = event.currentTarget.getBoundingClientRect();
        setFloatingNumbers(current => [
            ...current,
            {
                id: uuidv4(),
                value: damageDealt, // Show damage dealt, not fame earned
                x: rect.left + rect.width / 2 + (Math.random() * 80 - 40),
                y: rect.top + (Math.random() * 20 - 10),
            }
        ]);

        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 150);
    };

    const getCurrentImage = () => {
        if (!currentBoss) return '';
        const stageCount = currentBoss.images.length;
        const progress = Math.min(clicksOnCurrentBoss / currentBoss.clickThreshold, 1);
        const imageIndex = Math.min(Math.floor(progress * stageCount), stageCount - 1);
        return currentBoss.images[imageIndex];
    };

    const getHealthPercent = () => {
        if (!currentBoss) return 100;
        const percent = (clicksOnCurrentBoss / currentBoss.clickThreshold) * 100;
        return 100 - percent;
    };

    if (!currentBoss) return <div>Loading Boss...</div>;

    return (
        <>
            {floatingNumbers.map(num => (
                <span
                    key={num.id}
                    className="floating-number"
                    style={{ left: num.x, top: num.y }}
                    onAnimationEnd={() => setFloatingNumbers(current => current.filter(n => n.id !== num.id))}
                >
                    {num.value.toLocaleString()}
                </span>
            ))}
            
            <h3 style={{ textAlign: 'center' }}>
                {currentBoss.name}
                {isHealing && <span className="healing-indicator"> HEALING...</span>}
                {isInvulnerable && <span className="invulnerable-indicator"> INVULNERABLE</span>}
            </h3>

            <div
                className={`gem-button ${isHealing || isInvulnerable ? 'disabled' : ''}`}
                ref={gemButtonRef}
                onClick={handleGemClick}
            >
                <img
                    src={getCurrentImage()}
                    alt={currentBoss.name}
                    className={isShaking ? 'shake' : ''}
                />
            </div>

            <div className="health-bar-container">
                <div className="health-bar-inner" style={{ width: `${getHealthPercent()}%` }}></div>
                <span className="health-bar-text">
                    {Math.max(0, Math.floor(currentBoss.clickThreshold - clicksOnCurrentBoss)).toLocaleString()} / {currentBoss.clickThreshold.toLocaleString()}
                </span>
            </div>
        </>
    );
}