import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../../../stores/gameStore';
import { bosses } from '../../../data/bosses';
import toast from 'react-hot-toast';

export function BossDisplay() {
    // This component gets all the data and LOGIC it needs from the store...
    const {
        gamePhase,
        currentBossIndex,
        clicksOnCurrentBoss,
        isHealing,
        isInvulnerable,
        equippedWeapon,
        activeBuffs,
        pointsPerSecond,
        playSound,
        calculateDamageRange,
        applyClick,
        setPoison,
    } = useGameStore();

    // ...but it manages its OWN state for purely VISUAL things.
    const [floatingNumbers, setFloatingNumbers] = useState([]);
    const [isShaking, setIsShaking] = useState(false);
    const gemButtonRef = useRef(null);

    const currentBoss = bosses[currentBossIndex];

    const handleGemClick = (event) => {
        if (gamePhase !== 'clicking' || isHealing || isInvulnerable) return;

        playSound(currentBoss.clickSound, 0.5);
        let { minDamage, maxDamage } = calculateDamageRange();
        let damageDealt = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
        let fameEarned = damageDealt;
        const bonuses = useGameStore.getState().calculateAchievementBonuses();

        // Apply weapon effects
        switch (equippedWeapon) {
            case 'executioners_axe':
                if (Math.random() < 0.10) {
                    damageDealt *= 10;
                    toast('CRITICAL HIT!', { icon: '💥', duration: 1000 });
                }
                break;
            case 'golden_rapier':
                fameEarned *= 1.25;
                break;
            case 'stacking_vipers':
                setPoison({ stacks: useGameStore.getState().poison.stacks + 1, lastApplied: Date.now() });
                break;
            default:
                break;
        }

        const isArcaneFameProc = activeBuffs['arcane_power'] && Math.random() < 0.25;
        
        if (isArcaneFameProc) {
            let dps = pointsPerSecond * (activeBuffs['arcane_power'] ? 2 : 1);
            const fameFromAbility = Math.floor(dps * bonuses.fameMultiplier);
            // We can still call the store action for this special case
            useGameStore.getState().applyClick(0, fameFromAbility); // 0 damage, only fame
            setFloatingNumbers(current => [...current, { id: uuidv4(), value: fameFromAbility, x: event.clientX, y: event.clientY, className: 'fame-gain' }]);
        } else {
            fameEarned = Math.floor(fameEarned * bonuses.fameMultiplier);
            // Call the main action in the store to apply damage and fame
            applyClick(damageDealt, fameEarned);

            // Handle the visual feedback here in the component
            const rect = event.currentTarget.getBoundingClientRect();
            setFloatingNumbers(current => [...current, { id: uuidv4(), value: fameEarned, x: rect.left + rect.width / 2 + (Math.random() * 80 - 40), y: rect.top + (Math.random() * 20 - 10), }]);
        }

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
            <h1 style={{ color: 'red', zIndex: 9999 }}>TESTING BOSS DISPLAY</h1>
            {floatingNumbers.map(num => (
                <span
                    key={num.id}
                    className={`floating-number ${num.className || ''}`}
                    style={{ left: num.x, top: num.y }}
                    onAnimationEnd={() => setFloatingNumbers(current => current.filter(n => n.id !== num.id))}
                >
                    {num.className === 'fame-gain' ? '+' : '-'}{num.value.toLocaleString()}
                </span>
            ))}
            
            <h3 style={{ textAlign: 'center' }}>
                {currentBoss.name}
                {isHealing && <span className="healing-indicator"> HEALING...</span>}
                {isInvulnerable && <span className="invulnerable-indicator"> INVULNERABLE</span>}
            </h3>

            <div
                className={`gem-button ${isHealing || isInvulnerable || gamePhase === 'exalted_transition' ? 'disabled' : ''}`}
                ref={gemButtonRef}
                onClick={handleGemClick}
            >
                <img
                    src={getCurrentImage()}
                    alt={currentBoss.name}
                    className={`
                        ${gamePhase === 'transitioning' || gamePhase === 'exalted_transition' ? 'fading-out' : ''}
                        ${isShaking ? 'shake' : ''}
                    `}
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
