import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import toast from 'react-hot-toast';

// Import all game data
import { bosses } from '../data/bosses';
import { classUpgrades } from '../data/classUpgrades';
import { achievements } from '../data/achievements';
import { weapons } from '../data/weapons';
import { prestigeUpgrades } from '../data/prestigeUpgrades';

const defaultState = {
    // Core Gameplay
    score: 0,
    pointsPerSecond: 0,
    gamePhase: 'classSelection', // classSelection, clicking, transitioning, portal, finished, exalted_transition
    gameWon: false,

    // Player & Class
    playerClass: null,
    upgradesOwned: {},
    temporaryUpgradesOwned: {},

    // Boss
    currentBossIndex: 0,
    clicksOnCurrentBoss: 0,
    triggeredHeals: {},
    isHealing: false,
    isInvulnerable: false,

    // Prestige & Weapons
    exaltedShards: 0,
    prestigeUpgradesOwned: {},
    unlockedWeapons: {},
    equippedWeapon: 'default',

    // Abilities & Buffs
    abilityCooldowns: {},
    activeBuffs: {},
    poison: { stacks: 0, lastApplied: null },

    // Stats & Achievements
    totalClicks: 0,
    totalFameEarned: 0,
    bossesDefeated: {},
    unlockedAchievements: {},
    hasPrestiged: false,

    // System
    lastSavedTimestamp: null,
    isMuted: false,
};

// Using Immer for safe and easy state mutation
const immerSet = (fn) => (set) => set(produce(fn));

export const useGameStore = create(
    persist(
        immerSet((set, get) => ({
            ...defaultState,

            // Simple action to apply offline earnings. This is safe to call from anywhere.
            applyOfflineProgress: (offlineEarnings) => {
                set(state => {
                    state.score += offlineEarnings;
                    state.totalFameEarned += offlineEarnings;
                });
            },

            applyClick: (damageDealt, fameEarned) => {
                set(state => {
                    state.score += fameEarned;
                    state.totalFameEarned += fameEarned;
                    state.clicksOnCurrentBoss += damageDealt;
                    state.totalClicks += 1;
                });
                get().checkAchievements();
            },

            applyDps: () => {
                const state = get();
                if (state.pointsPerSecond <= 0 || state.isHealing || state.gamePhase !== 'clicking') return;

                let dps = state.pointsPerSecond;
                if (state.equippedWeapon === 'executioners_axe') dps *= 0.5;
                if (state.activeBuffs['arcane_power']) dps *= 2;
                
                const bonuses = state.calculateAchievementBonuses();
                const fameFromDps = Math.floor(dps * bonuses.fameMultiplier);
                const poisonDps = state.poison.stacks * (1 + Math.floor(state.currentBossIndex * 1.5));

                set(draft => {
                    draft.score += fameFromDps;
                    draft.totalFameEarned += fameFromDps;
                    draft.clicksOnCurrentBoss += poisonDps;
                });
            },
            
            checkBossDefeat: () => {
                const state = get();
                const currentBoss = bosses[state.currentBossIndex];
                if (!currentBoss || state.gamePhase !== 'clicking' || state.clicksOnCurrentBoss < currentBoss.clickThreshold) return;

                set(draft => {
                    draft.bossesDefeated[currentBoss.id] = (draft.bossesDefeated[currentBoss.id] || 0) + 1;
                });
                
                if (currentBoss.id === 'oryx3') {
                    set(draft => { draft.gamePhase = 'exalted_transition'; });
                } else if (state.currentBossIndex === bosses.length - 1) {
                    set(draft => { draft.gameWon = true; draft.gamePhase = 'finished'; });
                } else {
                    set(draft => { draft.gamePhase = 'transitioning'; });
                }
                
                get().checkAchievements();
            },

            handleClassSelect: (className) => {
                set(state => {
                    state.playerClass = className;
                    state.gamePhase = 'clicking';
                });
            },

            handleBuyUpgrade: (upgrade) => {
                const owned = get().upgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));

                if (get().score >= cost) {
                    set(state => {
                        state.score -= cost;
                        state.upgradesOwned[upgrade.id] = (state.upgradesOwned[upgrade.id] || 0) + 1;
                        if (upgrade.type === 'perSecond') {
                            state.pointsPerSecond += upgrade.value;
                        }
                    });
                } else {
                    toast.error("Not enough Fame!");
                }
            },
            
            handleBuyTemporaryUpgrade: (upgrade) => {
                const owned = get().temporaryUpgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.25, owned));
                
                if (get().score >= cost) {
                    set(state => {
                        state.score -= cost;
                        state.temporaryUpgradesOwned[upgrade.id] = (state.temporaryUpgradesOwned[upgrade.id] || 0) + 1;
                    });
                } else {
                    toast.error("Not enough Fame!");
                }
            },
            
            handleBuyPrestigeUpgrade: (upgrade) => {
                const owned = get().prestigeUpgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.5, owned));
                
                if (get().exaltedShards >= cost) {
                    set(state => {
                        state.exaltedShards -= cost;
                        state.prestigeUpgradesOwned[upgrade.id] = (state.prestigeUpgradesOwned[upgrade.id] || 0) + 1;
                    });
                } else {
                    toast.error("Not enough Exalted Shards!");
                }
            },
            
            handleUnlockWeapon: (weapon) => {
                if (get().exaltedShards >= weapon.cost) {
                    set(state => {
                        state.exaltedShards -= weapon.cost;
                        state.unlockedWeapons[weapon.id] = true;
                    });
                    toast.success(`Unlocked ${weapon.name}!`);
                } else {
                    toast.error("Not enough Exalted Shards!");
                }
            },
            
            handleEquipWeapon: (weaponId) => {
                set(state => { state.equippedWeapon = weaponId });
                const weapon = weapons.find(w => w.id === weaponId);
                toast.success(`Equipped ${weapon ? weapon.name : 'Default Sword'}!`);
            },
            
            handleEnterPortal: () => {
                set(state => {
                    state.currentBossIndex++;
                    state.clicksOnCurrentBoss = 0;
                    state.temporaryUpgradesOwned = {};
                    state.abilityCooldowns = {};
                    state.gamePhase = 'clicking';
                });
            },

            handlePrestige: () => {
                const { score, prestigeUpgradesOwned, calculateAchievementBonuses } = get();
                const bonuses = calculateAchievementBonuses();
                const shardsToAward = Math.floor((score / 2500000) * bonuses.shardMultiplier);

                if (shardsToAward < 1) {
                    toast.error("You need a higher score to prestige! Try reaching at least 2,500,000 Fame.");
                    return false;
                }
                
                if (window.confirm(`Are you sure you want to prestige? You will earn ${shardsToAward} Exalted Shards, but your Fame, upgrades, and boss progress will reset.`)) {
                    set(state => {
                        const startingFameLevel = prestigeUpgradesOwned['permanentFame'] || 0;
                        const startingPpsLevel = prestigeUpgradesOwned['permanentPPS'] || 0;
                        const startingScore = startingFameLevel * 1000;
                        const startingPps = startingPpsLevel * 50;

                        Object.assign(state, {
                            ...defaultState,
                            playerClass: state.playerClass,
                            exaltedShards: state.exaltedShards + shardsToAward,
                            prestigeUpgradesOwned: state.prestigeUpgradesOwned,
                            score: startingScore,
                            pointsPerSecond: startingPps,
                            totalClicks: state.totalClicks,
                            totalFameEarned: state.totalFameEarned,
                            unlockedAchievements: state.unlockedAchievements,
                            hasPrestiged: true,
                            isMuted: state.isMuted,
                            unlockedWeapons: state.unlockedWeapons,
                            gamePhase: 'clicking'
                        });
                    });
                    toast.success(`You earned ${shardsToAward} Exalted Shards!`);
                    return true;
                }
                return false;
            },
            
            setGamePhase: (phase) => set({ gamePhase: phase }),
            setGameWon: (won) => set({ gameWon: won }),
            toggleMute: () => set(state => ({ isMuted: !state.isMuted })),

            calculateDamageRange: () => {
                const state = get();
                let minDamage = 1, maxDamage = 1;
                const bonuses = state.calculateAchievementBonuses();

                const currentUpgrades = classUpgrades[`stage${Math.min(state.currentBossIndex + 1, 3)}`]?.[state.playerClass] || [];
                
                currentUpgrades.forEach(up => {
                    const owned = state.upgradesOwned[up.id] || 0;
                    if (owned > 0) {
                        if(up.type === 'perClick') { minDamage += (up.minBonus || 0) * owned; maxDamage += (up.maxBonus || 0) * owned; }
                        else if (up.clickBonus) { minDamage += up.clickBonus * owned; maxDamage += up.clickBonus * owned; }
                    }
                });
                
                const currentBoss = bosses[state.currentBossIndex];
                if (currentBoss?.temporaryUpgrades) {
                    currentBoss.temporaryUpgrades.forEach(tmpUp => {
                        const owned = state.temporaryUpgradesOwned[tmpUp.id] || 0;
                        if(owned > 0) {
                            minDamage += tmpUp.clickBonus * owned;
                            maxDamage += tmpUp.clickBonus * owned;
                        }
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
                
                return { minDamage: Math.floor(minDamage), maxDamage: Math.floor(maxDamage) };
            },
            
            calculateAchievementBonuses: () => {
                const unlocked = get().unlockedAchievements;
                const bonuses = { clickDamageMultiplier: 1, fameMultiplier: 1, clickDamageFlat: 0, shardMultiplier: 1 };
                achievements.forEach(ach => {
                    if (unlocked[ach.id]) {
                        if (ach.reward.type === 'CLICK_DAMAGE_MULTIPLIER') bonuses.clickDamageMultiplier += ach.reward.value;
                        if (ach.reward.type === 'FAME_MULTIPLIER') bonuses.fameMultiplier += ach.reward.value;
                        if (ach.reward.type === 'CLICK_DAMAGE_FLAT') bonuses.clickDamageFlat += ach.reward.value;
                        if (ach.reward.type === 'SHARD_MULTIPLIER') bonuses.shardMultiplier += ach.reward.value;
                    }
                });
                return bonuses;
            },

            checkAchievements: () => {
                const state = get();
                achievements.forEach(ach => {
                    if (!state.unlockedAchievements[ach.id] && ach.isUnlocked(state)) {
                        set(draft => { draft.unlockedAchievements[ach.id] = true });
                        toast.custom(t => (
                            <div className={`achievement-alert ${t.visible ? 'animate-enter' : 'animate-leave'}`} onClick={() => toast.dismiss(t.id)}>
                                <strong>🏆 Achievement Unlocked!</strong>
                                <p>{ach.name}</p>
                            </div>
                        ));
                    }
                });
            },

            playSound: (soundFile, volume = 1) => {
                if (!get().isMuted) {
                    try {
                        const audio = new Audio(soundFile);
                        audio.volume = volume;
                        audio.play().catch(e => console.error("Audio play failed:", e));
                    } catch (e) {
                        console.error("Audio creation failed:", e);
                    }
                }
            },
        })),
        {
            name: 'realmmaid-clicker-save',
            onRehydrateStorage: () => (state, error) => {
                if (state) {
                    state.lastSavedTimestamp = Date.now();
                }
            }
        }
    )
);
