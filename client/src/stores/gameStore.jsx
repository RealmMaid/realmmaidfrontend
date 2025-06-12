import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

import { bosses } from '../data/bosses';
import { classUpgrades } from '../data/classUpgrades';
import { achievements } from '../data/achievements';
import { weapons } from '../data/weapons';
import { prestigeUpgrades } from '../data/prestigeUpgrades';
import { abilities } from '../data/abilities';

/**
 * The default state for the game.
 * Used for initialization and for resetting on prestige.
 */
const defaultState = {
    score: 0,
    uncollectedFame: 0.0, // To track fractional fame between ticks!
    famePerSecond: 0,
    pointsPerSecond: 0, // Represents auto-damage dealt to the boss
    gamePhase: 'classSelection',
    gameWon: false,
    playerClass: null,
    upgradesOwned: {},
    temporaryUpgradesOwned: {},
    currentBossIndex: 0,
    clicksOnCurrentBoss: 0,
    triggeredHeals: {},
    isHealing: false,
    isInvulnerable: false,
    healTimer: 0,
    exaltedShards: 0,
    prestigeUpgradesOwned: {},
    unlockedWeapons: {},
    equippedWeapon: 'default',
    abilityCooldowns: {},
    activeBuffs: {},
    activeDebuffs: {},
    poison: { stacks: 0, lastApplied: null },
    totalClicks: 0,
    totalFameEarned: 0,
    bossesDefeated: {},
    unlockedAchievements: {},
    hasPrestiged: false,
    lastSavedTimestamp: null,
    isMuted: false,
};


export const useGameStore = create(
    persist(
        (set, get) => ({
            ...defaultState,

            // =======================================
            // Main Game Actions
            // =======================================

            handleClassSelect: (className) => {
                set({ playerClass: className, gamePhase: 'clicking' });
            },

            applyClick: (damageDealt, fameEarned) => {
                let finalFame = fameEarned;
                if (get().activeDebuffs.vulnerable) {
                    finalFame *= 1.5;
                }

                set(state => ({
                    score: state.score + finalFame,
                    totalFameEarned: state.totalFameEarned + finalFame,
                    clicksOnCurrentBoss: state.clicksOnCurrentBoss + damageDealt,
                    totalClicks: state.totalClicks + 1,
                }));
                get().checkAchievements();
            },

            gameTick: (delta) => {
                const state = get();
                const deltaSeconds = delta / 1000;

                if (state.isHealing) {
                    const healAmount = (bosses[state.currentBossIndex].healThresholds[0].amount / 5) * deltaSeconds;
                    set(s => ({
                        clicksOnCurrentBoss: Math.max(0, s.clicksOnCurrentBoss - healAmount),
                        healTimer: s.healTimer - delta,
                    }));
                    if (state.healTimer <= 0) {
                        set({ isHealing: false, isInvulnerable: false });
                    }
                    return;
                }

                // Fame calculation logic
                const fameThisTick = state.famePerSecond * deltaSeconds * state.calculateAchievementBonuses().fameMultiplier;
                const damageFromDps = state.pointsPerSecond * deltaSeconds;
                const poisonDps = state.poison.stacks * (1 + Math.floor(state.currentBossIndex * 1.5)) * deltaSeconds;
                
                set(s => {
                    const newUncollectedFame = s.uncollectedFame + fameThisTick;
                    const fameToAdd = Math.floor(newUncollectedFame);
                    const remainingUncollectedFame = newUncollectedFame - fameToAdd;

                    return {
                        uncollectedFame: remainingUncollectedFame,
                        score: s.score + fameToAdd,
                        totalFameEarned: s.totalFameEarned + fameToAdd,
                        clicksOnCurrentBoss: s.clicksOnCurrentBoss + damageFromDps + poisonDps,
                    };
                });

                const currentBoss = bosses[state.currentBossIndex];
                if(currentBoss) {
                    const healthPercent = 1 - (state.clicksOnCurrentBoss / currentBoss.clickThreshold);

                    for (let i = 0; i < currentBoss.healThresholds.length; i++) {
                        const threshold = currentBoss.healThresholds[i];
                        if (!state.triggeredHeals[i] && healthPercent * 100 <= threshold.percent) {
                            set(s => ({
                                isHealing: true,
                                isInvulnerable: true,
                                healTimer: 5000,
                                triggeredHeals: { ...s.triggeredHeals, [i]: true },
                            }));
                            toast.error(`${currentBoss.name} is healing!`, { icon: '💔' });
                            break; 
                        }
                    }
                }

                const now = Date.now();
                const activeBuffs = { ...state.activeBuffs };
                const activeDebuffs = { ...state.activeDebuffs };
                let buffsChanged = false;
                let debuffsChanged = false;
                for (const key in activeBuffs) {
                    if (activeBuffs[key].expiresAt <= now) {
                        delete activeBuffs[key];
                        buffsChanged = true;
                    }
                }
                for (const key in activeDebuffs) {
                    if (activeDebuffs[key].expiresAt <= now) {
                        delete activeDebuffs[key];
                        debuffsChanged = true;
                    }
                }
                if (buffsChanged) set({ activeBuffs });
                if (debuffsChanged) set({ activeDebuffs });
            },

            checkBossDefeat: () => {
                const state = get();
                const currentBoss = bosses[state.currentBossIndex];
                if (!currentBoss || state.gamePhase !== 'clicking' || state.clicksOnCurrentBoss < currentBoss.clickThreshold) return;

                set(s => ({ bossesDefeated: { ...s.bossesDefeated, [currentBoss.id]: (s.bossesDefeated[currentBoss.id] || 0) + 1 } }));
                
                if (currentBoss.id === 'oryx3') { 
                    set({ gamePhase: 'exalted_transition' }); 
                } else if (state.currentBossIndex === bosses.length - 1) { 
                    set({ gameWon: true, gamePhase: 'finished' }); 
                } else { 
                    set({ gamePhase: 'transitioning' }); 
                }
                get().checkAchievements();
            },

            handleTransitionEnd: () => {
                const state = get();
                const newBossIndex = state.gamePhase === 'exalted_transition' ? 3 : state.currentBossIndex + 1;
                set({
                    currentBossIndex: newBossIndex,
                    clicksOnCurrentBoss: 0,
                    gamePhase: 'clicking',
                    temporaryUpgradesOwned: {},
                    triggeredHeals: {},
                });
            },
            
            // =======================================
            // Abilities
            // =======================================
            handleUseAbility: (abilityId) => {
                const now = Date.now();
                const state = get();
                const ability = abilities.find(a => a.id === abilityId);
            
                if (!ability || (state.abilityCooldowns[abilityId] || 0) > now) {
                    toast.error('Ability is on cooldown!');
                    return;
                }
            
                switch (abilityId) {
                    case 'slam': {
                        if (state.pointsPerSecond <= 0) {
                            toast.error("Slam would have no effect with 0 DPS!");
                            return;
                        }
                        const slamDamage = Math.floor(state.pointsPerSecond * 30);
                        const fameFromSlam = Math.floor(slamDamage * state.calculateAchievementBonuses().fameMultiplier);
                        set(s => ({
                            score: s.score + fameFromSlam,
                            clicksOnCurrentBoss: s.clicksOnCurrentBoss + slamDamage
                        }));
                        toast.success('SLAM!', { icon: '💥' });
                        break;
                    }
                    case 'arcane_power': {
                        set(s => ({
                            activeBuffs: { ...s.activeBuffs, [ability.id]: { expiresAt: now + 10000 } }
                        }));
                        toast('Arcane Power surges!', { icon: '✨' });
                        break;
                    }
                    case 'armor_break': { 
                        set(s => ({
                            activeDebuffs: { ...s.activeDebuffs, vulnerable: { expiresAt: now + 5000 } }
                        }));
                        toast.success('Armor Broken!', { icon: '🛡️' });
                        break;
                    }
                    case 'virulent_outbreak': {
                        if (state.equippedWeapon === 'stacking_vipers') {
                            set(s => ({
                                poison: { stacks: s.poison.stacks + 50, lastApplied: now }
                            }));
                            toast('Poison surges!', { icon: '☠️' });
                        } else {
                            const flatDamage = 5000 * (state.currentBossIndex + 1);
                            const fameFromAbility = Math.floor(flatDamage * state.calculateAchievementBonuses().fameMultiplier);
                            set(s => ({
                                score: s.score + fameFromAbility,
                                clicksOnCurrentBoss: s.clicksOnCurrentBoss + flatDamage
                            }));
                            toast.success('Affliction strikes!', { icon: '☣️' });
                        }
                        break;
                    }
                }
            
                set(s => ({
                    abilityCooldowns: { ...s.abilityCooldowns, [abilityId]: now + ability.cooldown * 1000 }
                }));
            },

            // =======================================
            // Upgrade & Shop Actions
            // =======================================

            handleBuyUpgrade: (upgrade) => {
                const state = get();
                const owned = state.upgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));

                if (state.score >= cost) {
                    let fameBonus = 0;
                    let dpsBonus = 0;

                    if (upgrade.type === 'perSecond') {
                        fameBonus += upgrade.value;
                        dpsBonus += (upgrade.value * 0.25);
                    } else if (upgrade.type === 'perClick') {
                        fameBonus += ((upgrade.maxBonus || upgrade.clickBonus || 0) * 0.1);
                    }

                    set(s => ({
                        score: s.score - cost,
                        upgradesOwned: { ...s.upgradesOwned, [upgrade.id]: owned + 1 },
                        famePerSecond: s.famePerSecond + fameBonus,
                        pointsPerSecond: s.pointsPerSecond + dpsBonus,
                    }));
                } else { 
                    toast.error("Not enough Fame!"); 
                }
            },

            handleBuyTemporaryUpgrade: (upgrade) => {
                const state = get();
                const owned = state.temporaryUpgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.25, owned));
                if (state.score >= cost) {
                    set(s => ({
                        score: s.score - cost,
                        temporaryUpgradesOwned: { ...s.temporaryUpgradesOwned, [upgrade.id]: owned + 1 },
                    }));
                } else {
                    toast.error("Not enough Fame!");
                }
            },
            
            handleBuyPrestigeUpgrade: (upgrade) => {
                const state = get();
                const owned = state.prestigeUpgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.5, owned));
                if (state.exaltedShards >= cost) {
                    set(s => ({
                        exaltedShards: s.exaltedShards - cost,
                        prestigeUpgradesOwned: { ...s.prestigeUpgradesOwned, [upgrade.id]: owned + 1 },
                    }));
                } else {
                    toast.error("Not enough Exalted Shards!");
                }
            },

            handleUnlockWeapon: (weapon) => {
                const state = get();
                if (state.exaltedShards >= weapon.cost) {
                    set(s => ({
                        exaltedShards: s.exaltedShards - weapon.cost,
                        unlockedWeapons: { ...s.unlockedWeapons, [weapon.id]: true },
                    }));
                    toast.success(`Unlocked ${weapon.name}!`);
                } else {
                    toast.error("Not enough Exalted Shards!");
                }
            },

            // =======================================
            // Calculation Functions (Read-only)
            // =======================================

            calculateDamageRange: () => {
                const state = get();
                let minDamage = 1, maxDamage = 1;
                const bonuses = state.calculateAchievementBonuses();
                const currentUpgrades = classUpgrades[`stage${Math.min(state.currentBossIndex + 1, 3)}`]?.[state.playerClass] || [];
                
                currentUpgrades.forEach(up => {
                    const owned = state.upgradesOwned[up.id] || 0;
                    if (owned > 0) {
                        if (up.type === 'perClick') { 
                            minDamage += (up.minBonus || 0) * owned; 
                            maxDamage += (up.maxBonus || 0) * owned; 
                        } else if (up.clickBonus) {
                            minDamage += up.clickBonus * owned; 
                            maxDamage += up.clickBonus * owned; 
                        }
                    }
                });
                
                const currentBoss = bosses[state.currentBossIndex];
                if (currentBoss?.temporaryUpgrades) {
                    currentBoss.temporaryUpgrades.forEach(tmpUp => {
                        const owned = state.temporaryUpgradesOwned[tmpUp.id] || 0;
                        if(owned > 0) { minDamage += tmpUp.clickBonus * owned; maxDamage += tmpUp.clickBonus * owned; }
                    });
                }
                
                switch (state.equippedWeapon) {
                     case 'executioners_axe': minDamage *= 0.75; maxDamage *= 0.75; break;
                     case 'golden_rapier': minDamage *= 0.80; maxDamage *= 0.80; break;
                     case 'stacking_vipers': minDamage *= 0.20; maxDamage *= 0.20; break;
                }

                minDamage += bonuses.clickDamageFlat;
                maxDamage += bonuses.clickDamageFlat;
                const damageMultiplier = 1 + ((state.prestigeUpgradesOwned['permanentDamage'] || 0) * 0.10);
                minDamage *= damageMultiplier * bonuses.clickDamageMultiplier;
                maxDamage *= damageMultiplier * bonuses.clickDamageMultiplier;
                
                if (state.activeBuffs['arcane_power']) { minDamage *= 2; maxDamage *= 2; }
                
                if (state.activeDebuffs.vulnerable) {
                    minDamage *= 1.5;
                    maxDamage *= 1.5;
                }

                return { minDamage: Math.floor(minDamage), maxDamage: Math.floor(maxDamage) };
            },
            
            calculateAchievementBonuses: () => {
                const state = get();
                const unlocked = state.unlockedAchievements;
                const bonuses = {
                    clickDamageMultiplier: 1,
                    fameMultiplier: 1,
                    shardMultiplier: 1,
                    clickDamageFlat: 0,
                };
            
                achievements.forEach(ach => {
                    if (unlocked[ach.id]) {
                        switch (ach.reward.type) {
                            case 'CLICK_DAMAGE_MULTIPLIER': bonuses.clickDamageMultiplier += ach.reward.value; break;
                            case 'FAME_MULTIPLIER': bonuses.fameMultiplier += ach.reward.value; break;
                            case 'CLICK_DAMAGE_FLAT': bonuses.clickDamageFlat += ach.reward.value; break;
                            case 'SHARD_MULTIPLIER': bonuses.shardMultiplier += ach.reward.value; break;
                            default: break;
                        }
                    }
                });
                return bonuses;
            },

            checkAchievements: () => {
                const state = get();
                achievements.forEach(ach => {
                    if (!state.unlockedAchievements[ach.id] && ach.isUnlocked(state)) {
                        set(s => ({ unlockedAchievements: { ...s.unlockedAchievements, [ach.id]: true } }));
                        toast.custom(t => (
                            <div className={`achievement-alert ${t.visible ? 'animate-enter' : 'animate-leave'}`} onClick={() => toast.dismiss(t.id)}>
                                <strong>🏆 Achievement Unlocked!</strong>
                                <p>{ach.name}</p>
                            </div>
                        ), { duration: 4000 });
                    }
                });
            },

            // =======================================
            // Utility Actions
            // =======================================
            toggleMute: () => set(state => ({ isMuted: !state.isMuted })),

            playSound: (soundUrl, volume = 1.0) => {
                if (get().isMuted) return;
                try {
                    const audio = new Audio(soundUrl);
                    audio.volume = volume;
                    audio.play().catch(e => console.error("Audio play failed:", e));
                } catch (e) {
                    console.error("Could not play sound:", e);
                }
            },
            
            setPoison: (newPoisonState) => set({ poison: newPoisonState }),
        }),
        {
            name: 'realmmaid-clicker-save',
            onRehydrate: (state) => {
                console.log("Game state has been rehydrated from storage!");
            },
        }
    )
);
