// src/stores/gameStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

// Import all our game data so the store can use it
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
};

export const useGameStore = create(
    persist(
        (set, get) => ({
            // ====================================================================
            // STATE PROPERTIES
            // ====================================================================
            ...defaultState,

            // ====================================================================
            // ACTIONS (LOGIC THAT MODIFIES STATE)
            // ====================================================================

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

            calculateAchievementBonuses: () => {
                const bonuses = { clickDamageMultiplier: 1, fameMultiplier: 1, clickDamageFlat: 0, shardMultiplier: 1, };
                for (const ach of achievements) {
                    if (get().unlockedAchievements[ach.id]) {
                        switch (ach.reward.type) {
                            case 'CLICK_DAMAGE_MULTIPLIER': bonuses.clickDamageMultiplier += ach.reward.value; break;
                            case 'FAME_MULTIPLIER': bonuses.fameMultiplier += ach.reward.value; break;
                            case 'CLICK_DAMAGE_FLAT': bonuses.clickDamageFlat += ach.reward.value; break;
                            case 'SHARD_MULTIPLIER': bonuses.shardMultiplier += ach.reward.value; break;
                            default: break;
                        }
                    }
                }
                return bonuses;
            },

            calculateDamageRange: () => {
                let minDamage = 1; let maxDamage = 1;
                const { upgradesOwned, temporaryUpgradesOwned, currentBossIndex, prestigeUpgradesOwned, equippedWeapon } = get();
                const bonuses = get().calculateAchievementBonuses();
                const currentBoss = bosses[currentBossIndex];
                const bossStage = `stage${Math.min(currentBossIndex + 1, 3)}`;
                const currentUpgrades = classUpgrades[bossStage]?.[get().playerClass] || [];

                currentUpgrades.forEach(upgrade => {
                    const owned = upgradesOwned[upgrade.id] || 0;
                    if (owned > 0) {
                        const bonus = Math.floor(Math.pow(owned, 0.9));
                        if (upgrade.type === 'perClick') {
                            minDamage += (upgrade.minBonus || 0) * bonus;
                            maxDamage += (upgrade.maxBonus || 0) * bonus;
                        } else if (upgrade.type === 'perSecond' && upgrade.clickBonus) {
                            minDamage += upgrade.clickBonus * bonus;
                            maxDamage += upgrade.clickBonus * bonus;
                        }
                    }
                });

                if (currentBoss.temporaryUpgrades) {
                    currentBoss.temporaryUpgrades.forEach(tempUpgrade => {
                        const owned = temporaryUpgradesOwned[tempUpgrade.id] || 0;
                        if (owned > 0) {
                            const bonus = tempUpgrade.clickBonus * owned;
                            minDamage += bonus;
                            maxDamage += bonus;
                        }
                    });
                }

                switch (equippedWeapon) {
                    case 'executioners_axe': minDamage *= 0.75; maxDamage *= 0.75; break;
                    case 'golden_rapier': minDamage *= 0.80; maxDamage *= 0.80; break;
                    case 'stacking_vipers': minDamage *= 0.20; maxDamage *= 0.20; break;
                    default: break;
                }

                minDamage += bonuses.clickDamageFlat;
                maxDamage += bonuses.clickDamageFlat;

                const prestigeDamageBonus = prestigeUpgradesOwned['permanentDamage'] || 0;
                const damageMultiplier = 1 + (prestigeDamageBonus * 0.10);

                minDamage = minDamage * damageMultiplier * bonuses.clickDamageMultiplier;
                maxDamage = maxDamage * damageMultiplier * bonuses.clickDamageMultiplier;

                // This part now needs to be passed the activeBuffs from the component
                // For now, we omit it from the store calculation, it will be added in the component
                return { minDamage: Math.floor(minDamage), maxDamage: Math.floor(maxDamage) };
            },

            applyClick: (damageDealt, fameEarned) => {
                set(state => ({
                    score: state.score + fameEarned,
                    clicksOnCurrentBoss: state.clicksOnCurrentBoss + damageDealt,
                    totalClicks: state.totalClicks + 1,
                    totalFameEarned: state.totalFameEarned + fameEarned,
                }));
            },

            applyDps: (dps, fameMultiplier) => {
                const fameFromDps = Math.floor(dps * fameMultiplier);
                set(state => ({
                    score: state.score + fameFromDps,
                    totalFameEarned: state.totalFameEarned + fameFromDps,
                }));
            },

            applyPoison: (poisonStacks, currentBossIndex) => {
                const poisonDps = poisonStacks * (1 + Math.floor(currentBossIndex * 1.5));
                set(state => ({
                    clicksOnCurrentBoss: state.clicksOnCurrentBoss + poisonDps
                }));
            },

            applyHealing: (amount) => {
                set(state => ({
                    clicksOnCurrentBoss: Math.max(0, state.clicksOnCurrentBoss - amount)
                }));
            },

            handleClassSelect: (className) => set({ playerClass: className }),

            handleBuyUpgrade: (upgrade) => {
                const { score, upgradesOwned } = get();
                const owned = upgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));

                if (score >= cost) {
                    set(state => ({
                        score: state.score - cost,
                        pointsPerSecond: upgrade.type === 'perSecond' ? state.pointsPerSecond + upgrade.value : state.pointsPerSecond,
                        upgradesOwned: { ...state.upgradesOwned, [upgrade.id]: owned + 1 },
                    }));
                } else {
                    toast.error("Not enough points!");
                }
            },

            handleBuyTemporaryUpgrade: (upgrade) => {
                const { score, temporaryUpgradesOwned } = get();
                const owned = temporaryUpgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.25, owned));
                if (score >= cost) {
                    set(state => ({
                        score: state.score - cost,
                        temporaryUpgradesOwned: { ...state.temporaryUpgradesOwned, [upgrade.id]: owned + 1, }
                    }));
                } else {
                    toast.error("Not enough Fame!");
                }
            },

            handleBuyPrestigeUpgrade: (upgrade) => {
                const { exaltedShards, prestigeUpgradesOwned } = get();
                const owned = prestigeUpgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.5, owned));
                if (exaltedShards >= cost) {
                    set(state => ({
                        exaltedShards: state.exaltedShards - cost,
                        prestigeUpgradesOwned: { ...state.prestigeUpgradesOwned, [upgrade.id]: owned + 1 }
                    }));
                } else {
                    toast.error("Not enough Shards!");
                }
            },

            handleUnlockWeapon: (weapon) => {
                if (get().exaltedShards >= weapon.cost) {
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
            
            handlePrestige: () => {
                const { score, prestigeUpgradesOwned, playerClass, isMuted, unlockedWeapons } = get();
                const shardMultiplier = get().calculateAchievementBonuses().shardMultiplier;
                const shardsToAward = Math.floor((score / 2500000) * shardMultiplier);

                if (shardsToAward < 1) {
                    alert("You need a higher score to prestige!");
                    return false;
                }
                if (window.confirm(`Are you sure you want to prestige for ${shardsToAward} Exalted Shards?`)) {
                    const startingFameLevel = prestigeUpgradesOwned['permanentFame'] || 0;
                    const startingPpsLevel = prestigeUpgradesOwned['permanentPPS'] || 0;
                    set({
                        ...defaultState,
                        playerClass,
                        isMuted,
                        unlockedWeapons,
                        exaltedShards: get().exaltedShards + shardsToAward,
                        prestigeUpgradesOwned: prestigeUpgradesOwned,
                        score: startingFameLevel * 1000,
                        pointsPerSecond: startingPpsLevel * 50,
                        totalClicks: get().totalClicks,
                        totalFameEarned: get().totalFameEarned,
                        unlockedAchievements: get().unlockedAchievements,
                        hasPrestiged: true,
                    });
                    return true;
                }
                return false;
            },

            setAbilityCooldown: (abilityId, cooldown) => {
                const now = Date.now();
                set(state => ({
                    abilityCooldowns: { ...state.abilityCooldowns, [abilityId]: now + cooldown * 1000 }
                }));
            },

            checkForAchievementUnlocks: () => {
                const { unlockedAchievements } = get();
                for (const ach of achievements) {
                    if (!unlockedAchievements[ach.id] && ach.isUnlocked(get())) {
                        set(state => ({
                            unlockedAchievements: { ...state.unlockedAchievements, [ach.id]: true }
                        }));
                        toast.custom((t) => (
                            <div className={`achievement-alert ${t.visible ? 'animate-enter' : 'animate-leave'}`} onClick={() => toast(ach.rewardDescription, { icon: '🏆' })}>
                                <strong>🏆 Achievement Unlocked!</strong>
                                <p>{ach.name}</p>
                                <small>Click to see reward!</small>
                            </div>
                        ));
                    }
                }
            },

            advanceToNextBoss: (isPortal) => {
                set(state => ({
                    currentBossIndex: state.currentBossIndex + 1,
                    clicksOnCurrentBoss: 0,
                    temporaryUpgradesOwned: {},
                    abilityCooldowns: isPortal ? {} : state.abilityCooldowns, // Reset CDs on portal entry
                }));
            },
            
            toggleMute: () => set(state => ({ isMuted: !state.isMuted })),

            resetSave: () => {
                if (window.confirm("Are you sure? This will erase everything.")) {
                    set(defaultState);
                    // This is a utility to clear the persisted state if needed
                    // It's often good practice to also call localStorage.clear() or removeItem
                    localStorage.removeItem('pixel-clicker-save');
                }
            },
        }),
        {
            name: 'pixel-clicker-save',
        }
    )
);
