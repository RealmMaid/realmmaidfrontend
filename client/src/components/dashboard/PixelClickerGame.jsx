import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../../stores/gameStore';
import toast, { Toaster } from 'react-hot-toast';

// Data imports
import { classes } from '../../data/classes';
import { abilities } from '../../data/abilities';
import { achievements } from '../../data/achievements';
import { weapons } from '../../data/weapons';
import { bosses } from '../../data/bosses';
import { classUpgrades } from '../../data/classUpgrades';
import { prestigeUpgrades } from '../../data/prestigeUpgrades';

// In a larger project, each of these components would be in its own file.

function Hud() {
    const { score, exaltedShards, isMuted, toggleMute, resetSave } = useGameStore(state => ({
        score: state.score,
        exaltedShards: state.exaltedShards,
        isMuted: state.isMuted,
        toggleMute: state.toggleMute,
        resetSave: state.resetSave,
    }));

    return (
        <>
            <div className="game-hud">
                <button onClick={toggleMute} className="btn-mute">
                    {isMuted ? '🔇' : '🔊'}
                </button>
            </div>
            <div className="stats-display">
                <h2>{Math.floor(score).toLocaleString()} Fame</h2>
                <p style={{ color: '#8a2be2', fontWeight: 'bold' }}>
                    {exaltedShards} Exalted Shards
                </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem', paddingBottom: '1rem' }}>
                <button className="btn-reset" onClick={resetSave}> Reset Save Data </button>
            </div>
        </>
    );
}

function BossDisplay() {
    const gemButtonRef = useRef(null);
    const [isShaking, setIsShaking] = useState(false);
    const [floatingNumbers, setFloatingNumbers] = useState([]);

    const {
        gamePhase, currentBossIndex, clicksOnCurrentBoss, isHealing, isInvulnerable,
        equippedWeapon, activeBuffs, pointsPerSecond, playSound, applyClick, setPoison,
    } = useGameStore();

    const currentBoss = bosses[currentBossIndex];

    const handleGemClick = (event) => {
        if (gamePhase !== 'clicking' || isHealing || isInvulnerable) return;
        playSound(currentBoss.clickSound, 0.5);

        const { calculateDamageRange, calculateAchievementBonuses } = useGameStore.getState();
        let { minDamage, maxDamage } = calculateDamageRange(activeBuffs);
        let damageDealt = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
        let fameEarned = damageDealt;
        const bonuses = calculateAchievementBonuses();

        switch (equippedWeapon) {
            case 'executioners_axe': if (Math.random() < 0.10) { damageDealt *= 10; toast('CRITICAL HIT!', { icon: '💥', duration: 1000 }); } break;
            case 'golden_rapier': fameEarned *= 1.25; break;
            case 'stacking_vipers': setPoison(p => ({ stacks: p.stacks + 1, lastApplied: Date.now() })); break;
            default: break;
        }

        const isArcaneFameProc = activeBuffs['arcane_power'] && Math.random() < 0.25;
        if (isArcaneFameProc) {
            let dps = pointsPerSecond * (activeBuffs['arcane_power'] ? 2 : 1);
            const fameFromAbility = Math.floor(dps * bonuses.fameMultiplier);
            applyClick(0, fameFromAbility);
            setFloatingNumbers(current => [...current, { id: uuidv4(), value: fameFromAbility, x: event.clientX, y: event.clientY, className: 'fame-gain' }]);
        } else {
            fameEarned = Math.floor(fameEarned * bonuses.fameMultiplier);
            applyClick(damageDealt, fameEarned);
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
        return currentBoss.images[Math.min(Math.floor(progress * stageCount), stageCount - 1)];
    };
    
    const getHealthPercent = () => {
        if (!currentBoss) return 100;
        return 100 - (clicksOnCurrentBoss / currentBoss.clickThreshold) * 100;
    };

    if (!currentBoss) return <div>Loading Boss...</div>;

    return (
        <>
            {floatingNumbers.map(num => ( <span key={num.id} className={`floating-number ${num.className || ''}`} style={{ left: num.x, top: num.y }} onAnimationEnd={() => setFloatingNumbers(current => current.filter(n => n.id !== num.id))}> {num.className === 'fame-gain' ? '+' : '-'}{num.value.toLocaleString()} </span> ))}
            <h3 style={{ textAlign: 'center' }}> {currentBoss.name} {isHealing && <span className="healing-indicator"> HEALING...</span>} {isInvulnerable && <span className="invulnerable-indicator"> INVULNERABLE</span>} </h3>
            <div className={`gem-button ${isHealing || isInvulnerable || gamePhase !== 'clicking' ? 'disabled' : ''}`} ref={gemButtonRef} onClick={handleGemClick}>
                <img src={getCurrentImage()} alt={currentBoss.name} className={`${isShaking ? 'shake' : ''}`} />
            </div>
            <div className="health-bar-container">
                <div className="health-bar-inner" style={{ width: `${getHealthPercent()}%` }}></div>
                <span className="health-bar-text">{Math.max(0, Math.floor(currentBoss.clickThreshold - clicksOnCurrentBoss)).toLocaleString()} / {currentBoss.clickThreshold.toLocaleString()}</span>
            </div>
        </>
    );
}

// ... other components like ShopArea would be here ...

function GameContainer() {
    const { gamePhase, applyDpsFame, applyPoisonDamage, checkForAchievementUnlocks, equippedWeapon, setPoison, pointsPerSecond, activeBuffs } = useGameStore();

    useEffect(() => {
        checkForAchievementUnlocks();
    }, [useGameStore(state => state.totalClicks), useGameStore(state => state.totalFameEarned), useGameStore(state => state.bossesDefeated), useGameStore(state => state.hasPrestiged)]);

    useEffect(() => {
        if (gamePhase !== 'clicking') return;
        const bonuses = useGameStore.getState().calculateAchievementBonuses();
        let dps = pointsPerSecond;
        if (equippedWeapon === 'executioners_axe') dps *= 0.5;
        if (activeBuffs['arcane_power']) dps *= 2;
        const fameFromDps = Math.floor(dps * bonuses.fameMultiplier);
        if (fameFromDps <= 0) return;
        const interval = setInterval(() => applyDpsFame(fameFromDps), 1000);
        return () => clearInterval(interval);
    }, [gamePhase, pointsPerSecond, equippedWeapon, activeBuffs]);

    // ✨ THE FIX IS HERE! ✨
    // This new version of the poison useEffect does not cause an infinite loop.
    useEffect(() => {
        // We only start the interval if the correct weapon is equipped.
        if (equippedWeapon !== 'stacking_vipers') {
            setPoison({ stacks: 0, lastApplied: null }); // Clear poison if weapon is unequipped
            return;
        }

        const poisonInterval = setInterval(() => {
            // Inside the interval, we get the LATEST state directly from the store
            // using getState(). This does not create a dependency on the state itself.
            const { poison, currentBossIndex } = useGameStore.getState();

            if (poison.stacks > 0) {
                // Decay stacks if the player hasn't clicked recently
                if (Date.now() - poison.lastApplied > 3000) {
                    setPoison({ ...poison, stacks: Math.max(0, poison.stacks - 1) });
                }
                // Apply poison damage
                const poisonDps = poison.stacks * (1 + Math.floor(currentBossIndex * 1.5));
                applyPoisonDamage(poisonDps);
            }
        }, 1000);

        // The cleanup function stops the interval when the weapon is unequipped.
        return () => clearInterval(poisonInterval);
    }, [equippedWeapon, setPoison, applyPoisonDamage]); // The effect ONLY re-runs if the weapon changes.

    return (
        <div className="card">
            <div className="clicker-container">
                <Hud />
                <BossDisplay />
                {/* Other components like AbilityBar and ShopArea would be rendered here */}
            </div>
        </div>
    );
}

function ClassSelection() {
    const handleClassSelect = useGameStore(state => state.handleClassSelect);
    return (
        <div className="card">
            <div className="clicker-container">
                <h3>Choose Your Class, Cutie!</h3>
                <div className="class-selection-container">
                    {classes.map(pClass => (
                        <button key={pClass.id} className="btn-class-select" onClick={() => handleClassSelect(pClass.id)}>
                            <img src={pClass.image} alt={pClass.name} />
                            <span>{pClass.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PixelClickerGame() {
    const playerClass = useGameStore(state => state.playerClass);
    
    return (
        <>
            <Toaster position="top-right" />
            {playerClass ? <GameContainer /> : <ClassSelection />}
        </>
    );
}

export default PixelClickerGame;
