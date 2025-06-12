import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

import { bosses } from '../data/bosses';
import { classUpgrades } from '../data/classUpgrades';
import { achievements } from '../data/achievements';
import { weapons } from '../data/weapons';
import { prestigeUpgrades } from '../data/prestigeUpgrades';
import { abilities } from '../data/abilities';

const defaultState = {
    score: 0,
    pointsPerSecond: 0,
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
    exaltedShards: 0,
    prestigeUpgradesOwned: {},
    unlockedWeapons: {},
    equippedWeapon: 'default',
    abilityCooldowns: {},
    activeBuffs: {},
    poison: { stacks: 0, lastApplied: null },
    totalClicks: 0,
    totalFameEarned: 0,
    bossesDefeated: {},
    unlockedAchievements: {},
    hasPrestiged: false,
    lastSavedTimestamp: null,
    isMuted: false,
};

// ====================================================================
// ACTION IMPLEMENTATIONS (The "private" helper functions)
// Each one explicitly takes `set` and `get` as arguments.
// ====================================================================

const _applyOfflineProgress = (set, get, offlineEarnings) => {
    set(state => ({
        score: state.score + offlineEarnings,
        totalFameEarned: state.totalFameEarned + offlineEarnings,
    }));
};

const _applyClick = (set, get, damageDealt, fameEarned) => {
    set(state => ({
        score: state.score + fameEarned,
        totalFameEarned: state.totalFameEarned + fameEarned,
        clicksOnCurrentBoss: state.clicksOnCurrentBoss + damageDealt,
        totalClicks: state.totalClicks + 1,
    }));
    get().checkAchievements();
};

const _handleClassSelect = (set, get, className) => {
    set({ playerClass: className, gamePhase: 'clicking' });
};

const _handleUseAbility = (set, get, abilityId, context) => {
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
            const dps = state.activeBuffs['arcane_power'] ? state.pointsPerSecond * 2 : state.pointsPerSecond;
            const slamDamage = Math.floor(dps * 30);
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
            toast('Arcane Power surges through you!', { icon: '✨' });
            break;
        }
        case 'virulent_outbreak': {
            if (state.equippedWeapon === 'stacking_vipers') {
                set(s => ({
                    poison: { stacks: s.poison.stacks + 50, lastApplied: now }
                }));
                toast('Poison surges!', { icon: '🧪' });
            } else {
                const flatDamage = 5000 * (state.currentBossIndex + 1);
                const fameFromAbility = Math.floor(flatDamage * state.calculateAchievementBonuses().fameMultiplier);
                set(s => ({
                    score: s.score + fameFromAbility,
                    clicksOnCurrentBoss: s.clicksOnCurrentBoss + flatDamage
                }));
                toast.success('Affliction strikes!', { icon: '💀' });
            }
            break;
        }
    }

    set(s => ({
        abilityCooldowns: { ...s.abilityCooldowns, [abilityId]: now + ability.cooldown * 1000 }
    }));
};

// ... (all other private helper functions from the full version)

// ====================================================================
// THE ZUSTAND STORE
// ====================================================================

export const useGameStore = create(
    persist(
        (set, get) => ({
            ...defaultState,

<<<<<<< HEAD
            // Public-facing actions now call the "private" implementation functions
            applyOfflineProgress: (earnings) => _applyOfflineProgress(set, get, earnings),
            applyClick: (damage, fame) => _applyClick(set, get, damage, fame),
            handleClassSelect: (className) => _handleClassSelect(set, get, className),
            handleUseAbility: (abilityId, context) => _handleUseAbility(set, get, abilityId, context),
=======
            applyOfflineProgress: (offlineEarnings) => {
                set(state => ({
                    score: state.score + offlineEarnings,
                    totalFameEarned: state.totalFameEarned + offlineEarnings,
                }));
            },

            applyClick: (damageDealt, fameEarned) => {
                set(state => ({
                    score: state.score + fameEarned,
                    totalFameEarned: state.totalFameEarned + fameEarned,
                    clicksOnCurrentBoss: state.clicksOnCurrentBoss + damageDealt,
                    totalClicks: state.totalClicks + 1,
                }));
                get().checkAchievements();
            },
>>>>>>> ee06f66788f7b9c64867c85c5ff0ad56e05ad092

            // You can define the rest of the actions here following the same pattern
            // For now, let's keep the simple ones as they were
            applyDps: () => {
                const state = get();
                if (state.pointsPerSecond <= 0 || state.isHealing || state.gamePhase !== 'clicking') return;
                let dps = state.pointsPerSecond;
                if (state.equippedWeapon === 'executioners_axe') dps *= 0.5;
                if (state.activeBuffs['arcane_power']) dps *= 2;
                const bonuses = get().calculateAchievementBonuses();
                const fameFromDps = Math.floor(dps * bonuses.fameMultiplier);
                const poisonDps = state.poison.stacks * (1 + Math.floor(state.currentBossIndex * 1.5));
<<<<<<< HEAD
=======

>>>>>>> ee06f66788f7b9c64867c85c5ff0ad56e05ad092
                set(s => ({
                    score: s.score + fameFromDps,
                    totalFameEarned: s.totalFameEarned + fameFromDps,
                    clicksOnCurrentBoss: s.clicksOnCurrentBoss + poisonDps,
                }));
            },
            
            checkBossDefeat: () => {
                const state = get();
                const currentBoss = bosses[state.currentBossIndex];
                if (!currentBoss || state.gamePhase !== 'clicking' || state.clicksOnCurrentBoss < currentBoss.clickThreshold) return;
<<<<<<< HEAD
                set(s => ({ bossesDefeated: { ...s.bossesDefeated, [currentBoss.id]: (s.bossesDefeated[currentBoss.id] || 0) + 1 } }));
                if (currentBoss.id === 'oryx3') { set({ gamePhase: 'exalted_transition' }); }
                else if (state.currentBossIndex === bosses.length - 1) { set({ gameWon: true, gamePhase: 'finished' }); }
                else { set({ gamePhase: 'transitioning' }); }
                get().checkAchievements();
            },
            
=======

                set(s => ({
                    bossesDefeated: {
                        ...s.bossesDefeated,
                        [currentBoss.id]: (s.bossesDefeated[currentBoss.id] || 0) + 1,
                    }
                }));
                
                if (currentBoss.id === 'oryx3') {
                    set({ gamePhase: 'exalted_transition' });
                } else if (state.currentBossIndex === bosses.length - 1) {
                    set({ gameWon: true, gamePhase: 'finished' });
                } else {
                    set({ gamePhase: 'transitioning' });
                }
                
                get().checkAchievements();
            },

            handleClassSelect: (className) => {
                set({
                    playerClass: className,
                    gamePhase: 'clicking',
                });
            },

>>>>>>> ee06f66788f7b9c64867c85c5ff0ad56e05ad092
            handleBuyUpgrade: (upgrade) => {
                const state = get();
                const owned = state.upgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));
<<<<<<< HEAD
                if (state.score >= cost) {
                    set(s => ({
                        score: s.score - cost,
                        upgradesOwned: { ...s.upgradesOwned, [upgrade.id]: (s.upgradesOwned[upgrade.id] || 0) + 1 },
                        pointsPerSecond: upgrade.type === 'perSecond' ? s.pointsPerSecond + upgrade.value : s.pointsPerSecond,
                    }));
                } else { toast.error("Not enough Fame!"); }
            },
            
=======

                if (state.score >= cost) {
                    set(s => ({
                        score: s.score - cost,
                        upgradesOwned: {
                            ...s.upgradesOwned,
                            [upgrade.id]: (s.upgradesOwned[upgrade.id] || 0) + 1,
                        },
                        pointsPerSecond: upgrade.type === 'perSecond' ? s.pointsPerSecond + upgrade.value : s.pointsPerSecond,
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
                        temporaryUpgradesOwned: {
                            ...s.temporaryUpgradesOwned,
                            [upgrade.id]: (s.temporaryUpgradesOwned[upgrade.id] || 0) + 1,
                        }
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
                        prestigeUpgradesOwned: {
                            ...s.prestigeUpgradesOwned,
                            [upgrade.id]: (s.prestigeUpgradesOwned[upgrade.id] || 0) + 1,
                        }
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
                        unlockedWeapons: {
                            ...s.unlockedWeapons,
                            [weapon.id]: true,
                        }
                    }));
                    toast.success(`Unlocked ${weapon.name}!`);
                } else {
                    toast.error("Not enough Exalted Shards!");
                }
            },
            
            handleEquipWeapon: (weaponId) => {
                set({ equippedWeapon: weaponId });
                const weapon = weapons.find(w => w.id === weaponId);
                toast.success(`Equipped ${weapon ? weapon.name : 'Default Sword'}!`);
            },
            
            handleEnterPortal: () => {
                set(state => ({
                    currentBossIndex: state.currentBossIndex + 1,
                    clicksOnCurrentBoss: 0,
                    temporaryUpgradesOwned: {},
                    abilityCooldowns: {},
                    gamePhase: 'clicking',
                }));
            },

            handlePrestige: () => {
                const state = get();
                const bonuses = state.calculateAchievementBonuses();
                const shardsToAward = Math.floor((state.score / 2500000) * bonuses.shardMultiplier);

                if (shardsToAward < 1) {
                    toast.error("You need a higher score to prestige! Try reaching at least 2,500,000 Fame.");
                    return false;
                }
                
                if (window.confirm(`Are you sure you want to prestige? You will earn ${shardsToAward} Exalted Shards, but your Fame, upgrades, and boss progress will reset.`)) {
                    const startingFameLevel = state.prestigeUpgradesOwned['permanentFame'] || 0;
                    const startingPpsLevel = state.prestigeUpgradesOwned['permanentPPS'] || 0;
                    
                    set({
                        ...defaultState,
                        playerClass: state.playerClass,
                        exaltedShards: state.exaltedShards + shardsToAward,
                        prestigeUpgradesOwned: state.prestigeUpgradesOwned,
                        score: startingFameLevel * 1000,
                        pointsPerSecond: startingPpsLevel * 50,
                        totalClicks: state.totalClicks,
                        totalFameEarned: state.totalFameEarned,
                        unlockedAchievements: state.unlockedAchievements,
                        hasPrestiged: true,
                        isMuted: state.isMuted,
                        unlockedWeapons: state.unlockedWeapons,
                        gamePhase: 'clicking'
                    });
                    toast.success(`You earned ${shardsToAward} Exalted Shards!`);
                    return true;
                }
                return false;
            },
            
            setGamePhase: (phase) => set({ gamePhase: phase }),
            setGameWon: (won) => set({ gameWon: won }),
            toggleMute: () => set(state => ({ isMuted: !state.isMuted })),

>>>>>>> ee06f66788f7b9c64867c85c5ff0ad56e05ad092
            calculateDamageRange: () => {
                // This function doesn't set state, so it needs no changes
                const state = get();
<<<<<<< HEAD
                let minDamage = 1, maxDamage = 1;
                const bonuses = state.calculateAchievementBonuses();
                const currentUpgrades = classUpgrades[`stage${Math.min(state.currentBossIndex + 1, 3)}`]?.[state.playerClass] || [];
                currentUpgrades.forEach(up => {
                    const owned = state.upgradesOwned[up.id] || 0;
                    if (owned > 0) {
                        if (up.type === 'perClick') { minDamage += (up.minBonus || 0) * owned; maxDamage += (up.maxBonus || 0) * owned; }
                        else if (up.clickBonus) { minDamage += up.clickBonus * owned; maxDamage += up.clickBonus * owned; }
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
=======
                // ... (rest of function is unchanged)
>>>>>>> ee06f66788f7b9c64867c85c5ff0ad56e05ad092
                return { minDamage: Math.floor(minDamage), maxDamage: Math.floor(maxDamage) };
            },
            
            calculateAchievementBonuses: () => {
                // This function doesn't set state, so it needs no changes
                const unlocked = get().unlockedAchievements;
                // ... (rest of function is unchanged)
                return bonuses;
            },
            
            checkAchievements: () => {
                const state = get();
                achievements.forEach(ach => {
                    if (!state.unlockedAchievements[ach.id] && ach.isUnlocked(state)) {
<<<<<<< HEAD
                        set(s => ({ unlockedAchievements: { ...s.unlockedAchievements, [ach.id]: true } }));
=======
                        set(s => ({
                            unlockedAchievements: {
                                ...s.unlockedAchievements,
                                [ach.id]: true,
                            }
                        }));
>>>>>>> ee06f66788f7b9c64867c85c5ff0ad56e05ad092
                        toast.custom(t => (
                            <div className={`achievement-alert ${t.visible ? 'animate-enter' : 'animate-leave'}`} onClick={() => toast.dismiss(t.id)}>
                                <strong>🏆 Achievement Unlocked!</strong>
                                <p>{ach.name}</p>
                            </div>
                        ));
                    }
                });
            },
<<<<<<< HEAD
=======

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
>>>>>>> ee06f66788f7b9c64867c85c5ff0ad56e05ad092
        }),
        {
            name: 'realmmaid-clicker-save',
        }
    )
);