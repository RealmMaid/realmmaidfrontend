// src/stores/gameStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// Import all our game data
import { classes } from '../data/classes';
import { abilities } from '../data/abilities';
import { achievements } from '../data/achievements';
import { weapons } from '../data/weapons';
import { bosses } from '../data/bosses';
import { classUpgrades } from '../data/classUpgrades';
import { prestigeUpgrades } from '../data/prestigeUpgrades';

const defaultState = {
    score: 0,
    pointsPerSecond: 0,
    currentBossIndex: 0,
    clicksOnCurrentBoss: 0,
    upgradesOwned: {},
    playerClass: null,
    triggeredHeals: {},
    exaltedShards: 0,
    prestigeUpgradesOwned: {},
    temporaryUpgradesOwned: {},
    unlockedWeapons: {},
    equippedWeapon: 'default',
    abilityCooldowns: {},
    totalClicks: 0,
    totalFameEarned: 0,
    bossesDefeated: {},
    unlockedAchievements: {},
    hasPrestiged: false,
    isMuted: false,
    // We no longer need lastSavedTimestamp because persist middleware handles it
};

export const useGameStore = create(
    persist(
        (set, get) => ({
            ...defaultState,

            // ====================================================================
            // ACTIONS (LOGIC THAT MODIFIES STATE)
            // ====================================================================

            handleClassSelect: (className) => {
                set({ playerClass: className });
            },

            handleBuyUpgrade: (upgrade) => {
                const { score, upgradesOwned, pointsPerSecond } = get();
                const owned = upgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));

                if (score >= cost) {
                    set(state => ({
                        score: state.score - cost,
                        pointsPerSecond: upgrade.type === 'perSecond' ? state.pointsPerSecond + upgrade.value : state.pointsPerSecond,
                        upgradesOwned: {
                            ...state.upgradesOwned,
                            [upgrade.id]: (state.upgradesOwned[upgrade.id] || 0) + 1,
                        },
                    }));
                } else {
                    toast.error("Oopsie! Not enough points, cutie!");
                }
            },

            handleBuyTemporaryUpgrade: (upgrade) => {
                const { score, temporaryUpgradesOwned } = get();
                const cost = Math.floor(upgrade.cost * Math.pow(1.25, temporaryUpgradesOwned[upgrade.id] || 0));
                if (score >= cost) {
                    set(state => ({
                        score: state.score - cost,
                        temporaryUpgradesOwned: {
                            ...state.temporaryUpgradesOwned,
                            [upgrade.id]: (state.temporaryUpgradesOwned[upgrade.id] || 0) + 1,
                        }
                    }));
                } else {
                    toast.error("Not enough Fame for that boost!");
                }
            },
            
            handleBuyPrestigeUpgrade: (upgrade) => {
                const { exaltedShards, prestigeUpgradesOwned } = get();
                const owned = prestigeUpgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.5, owned));

                if (exaltedShards >= cost) {
                    set(state => ({
                        exaltedShards: state.exaltedShards - cost,
                        prestigeUpgradesOwned: {
                            ...state.prestigeUpgradesOwned,
                            [upgrade.id]: (state.prestigeUpgradesOwned[upgrade.id] || 0) + 1
                        }
                    }));
                } else {
                    toast.error("Not enough Exalted Shards!");
                }
            },
            
            handleUnlockWeapon: (weapon) => {
                const { exaltedShards } = get();
                if (exaltedShards >= weapon.cost) {
                    set(state => ({
                        exaltedShards: state.exaltedShards - weapon.cost,
                        unlockedWeapons: { ...state.unlockedWeapons, [weapon.id]: true }
                    }));
                    toast.success(`Unlocked ${weapon.name}!`);
                } else {
                    alert("Not enough Exalted Shards!");
                }
            },

            handleEquipWeapon: (weaponId) => {
                const weaponName = weapons.find(w => w.id === weaponId)?.name || 'Default Sword';
                set({ equippedWeapon: weaponId });
                toast.success(`Equipped ${weaponName}!`);
            },
            
            handleUseAbility: (abilityId, activeBuffs, fameMultiplier) => {
                const now = Date.now();
                const { abilityCooldowns, pointsPerSecond, equippedWeapon, currentBossIndex } = get();
                const ability = abilities.find(a => a.id === abilityId);

                if (!ability || (abilityCooldowns[abilityId] || 0) > now) {
                    toast.error('Ability is on cooldown!');
                    return;
                }
        
                switch (abilityId) {
                    case 'slam': {
                        if (pointsPerSecond <= 0) {
                            toast.error("Slam would have no effect with 0 DPS!");
                            return; // Exit without using cooldown
                        }
                        let dps = pointsPerSecond;
                        if(activeBuffs['arcane_power']) dps *= 2;
                        const slamDamage = Math.floor(dps * 30);
                        const fameFromSlam = Math.floor(slamDamage * fameMultiplier);
                        set(state => ({
                            score: state.score + fameFromSlam,
                            clicksOnCurrentBoss: state.clicksOnCurrentBoss + slamDamage
                        }));
                        toast.success('SLAM!', { icon: '💥' });
                        break;
                    }
                    case 'arcane_power': {
                        // The buff logic will be handled in the component via useEffect
                        toast('Arcane Power surges through you!', { icon: '✨' });
                        break;
                    }
                    case 'virulent_outbreak': {
                        if (equippedWeapon === 'stacking_vipers') {
                            toast('Poison surges!', { icon: '🧪' });
                            // This action now returns the effect to be set in the component
                            return { type: 'SET_POISON', payload: { stacks: get().poison.stacks + 50, lastApplied: now } };
                        } else {
                            const flatDamage = 5000 * (currentBossIndex + 1);
                            const fameFromAbility = Math.floor(flatDamage * fameMultiplier);
                            set(state => ({
                                score: state.score + fameFromAbility,
                                clicksOnCurrentBoss: state.clicksOnCurrentBoss + flatDamage
                            }));
                            toast.success('Affliction strikes!', { icon: '💀' });
                        }
                        break;
                    }
                    default: break;
                }

                // Set the new cooldown
                set(state => ({
                    abilityCooldowns: { ...state.abilityCooldowns, [abilityId]: now + ability.cooldown * 1000 }
                }));
            },

            handlePrestige: (fameMultiplier, shardMultiplier) => {
                const { score, prestigeUpgradesOwned, playerClass, isMuted, unlockedWeapons } = get();
                const shardsToAward = Math.floor((score / 2500000) * shardMultiplier);

                if (shardsToAward < 1) {
                    alert("You need a higher score to prestige! Try reaching at least 2,500,000 Fame.");
                    return false;
                }
                const isConfirmed = window.confirm(`Are you sure you want to prestige? You will earn ${shardsToAward} Exalted Shards?`);
                
                if (isConfirmed) {
                    const startingFameLevel = prestigeUpgradesOwned['permanentFame'] || 0;
                    const startingPpsLevel = prestigeUpgradesOwned['permanentPPS'] || 0;
                    set({
                        ...defaultState,
                        playerClass: playerClass,
                        exaltedShards: get().exaltedShards + shardsToAward,
                        prestigeUpgradesOwned: prestigeUpgradesOwned,
                        score: startingFameLevel * 1000,
                        pointsPerSecond: startingPpsLevel * 50,
                        totalClicks: get().totalClicks,
                        totalFameEarned: get().totalFameEarned,
                        unlockedAchievements: get().unlockedAchievements,
                        hasPrestiged: true,
                        isMuted: isMuted,
                        unlockedWeapons: unlockedWeapons,
                    });
                    return true;
                }
                return false;
            },
            
            toggleMute: () => set(state => ({ isMuted: !state.isMuted })),

            // We can add many more actions here...
            applyDamage: (damage, fame) => {
                set(state => ({
                    score: state.score + fame,
                    clicksOnCurrentBoss: state.clicksOnCurrentBoss + damage,
                    totalClicks: state.totalClicks + 1,
                    totalFameEarned: state.totalFameEarned + fame,
                }));
            },

            resetSave: () => {
                if (window.confirm("Are you sure you want to reset all your progress?")) {
                    set(defaultState);
                }
            },
        }),
        {
            name: 'pixel-clicker-game-save', // This is the key in localStorage
        }
    )
);
