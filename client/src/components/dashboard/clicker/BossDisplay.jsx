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
    // Select the state we need. We now use currentBossId!
    const gamePhase = useGameStore(state => state.gamePhase);
    const currentBossId = useGameStore(state => state.currentBossId); // ✨ NEW
    const clicksOnCurrentBoss = useGameStore(state => state.clicksOnCurrentBoss);
    const isHealing = useGameStore(state => state.isHealing);
    const isInvulnerable = useGameStore(state => state.isInvulnerable);
    
    // Actions
    const playSound = useGameStore(state => state.playSound);
    const calculateDamageRange = useGameStore(state => state.calculateDamageRange);
    const applyClick = useGameStore(state => state.applyClick);

    const [floatingNumbers, setFloatingNumbers] = useState([]);
    const [isShaking, setIsShaking] = useState(false);
    const gemButtonRef = useRef(null);

    // ✨ UPDATED: Find the current boss object using the ID from the store.
    const currentBoss = useMemo(() => bosses.find(b => b.id === currentBossId), [currentBossId]);

    const handleGemClick = (event) => {
        if (gamePhase !== 'clicking' || isHealing || isInvulnerable) return;
        
        // Safety check in case the boss isn't found
        if (!currentBoss) return;

        if (currentBoss.clickSound) {
            playSound(currentBoss.clickSound, 0.5);
        }
        
        let { minDamage, maxDamage } = calculateDamageRange();
        let damageDealt = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
        let fameEarned = damageDealt;

        // Weapon effects could be expanded here...
        
        const bonuses = useGameStore.getState().calculateAchievementBonuses();
        fameEarned = Math.floor(fameEarned * bonuses.fameMultiplier);
        
        applyClick(damageDealt, fameEarned);

        const rect = event.currentTarget.getBoundingClientRect();
        setFloatingNumbers(current => [
            ...current,
            {
                id: uuidv4(),
                value: damageDealt,
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

    // ✨ NEW: A safety guard for when the game is loading.
    if (!currentBoss) {
        return <div>Loading Boss...</div>;
    }

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
