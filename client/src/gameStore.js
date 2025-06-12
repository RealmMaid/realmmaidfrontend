import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Import all game data
import { abilities } from '../data/abilities';
import { achievements } from '../data/achievements';
import { weapons } from '../data/weapons';
import { bosses } from '../data/bosses';
import { classUpgrades } from '../data/classUpgrades';
import { prestigeUpgrades } from '../data/prestigeUpgrades';

const defaultState = {
    score: 0,
    pointsPerSecond: 0,
    lastUpdated: Date.now(),
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
    notificationQueue: [],
    gamePhase: 'classSelection',
    gameWon: false,
    isHealing: false,
    isInvulnerable: false,
    activeBuffs: {},
    poison: { stacks: 0, lastApplied: 0 },
};

export const useGameStore = create(
    persist(
        (set, get) => ({
            ...defaultState,

            // --- Getters / Calculators ---
            calculateDamageRange: () => {
                // This is a basic implementation. You can expand on this.
                let min = 1;
                let max = 5;
                return { minDamage: min, maxDamage: max };
            },
            calculateAchievementBonuses: () => {
                // Basic implementation
                return { fameMultiplier: 1, shardMultiplier: 1 };
            },

            // --- Game Flow Actions ---
            setGamePhase: (phase) => set({ gamePhase: phase }),
            setGameWon: (won) => set({ gameWon: won }),
            handleClassSelect: (className) => set({ playerClass: className, gamePhase: 'clicking' }),
            advanceToNextBoss: (isPortal) => {
                 set(state => ({
                     currentBossIndex: state.currentBossIndex + 1,
                     clicksOnCurrentBoss: 0,
                     temporaryUpgradesOwned: {},
                     triggeredHeals: {},
                     abilityCooldowns: isPortal ? {} : state.abilityCooldowns,
                 }));
            },
            handleEnterPortal: () => {
                // Placeholder for portal logic
                get().advanceToNextBoss(true);
            },

            // --- Sound & Save Actions ---
            toggleMute: () => set(state => ({ isMuted: !state.isMuted })),
            playSound: (soundFile, volume = 1) => {
                if (!get().isMuted) {
                    try { new Audio(soundFile).play(); } catch (e) {}
                }
            },
            
            // --- Purchase Handlers ---
            handleBuyUpgrade: (upgrade) => { /* ... your logic ... */ },
            handleBuyTemporaryUpgrade: (upgrade) => { /* ... your logic ... */ },
            handleBuyPrestigeUpgrade: (upgrade) => { /* ... your logic ... */ },
            handleUnlockWeapon: (weapon) => { /* ... your logic ... */ },
            handleEquipWeapon: (weaponId) => set({ equippedWeapon: weaponId }),

            // --- Combat & Game Mechanic Actions ---
            applyClick: (damage, fame) => {
                set(state => ({
                    score: state.score + fame,
                    clicksOnCurrentBoss: state.clicksOnCurrentBoss + damage,
                    totalClicks: state.totalClicks + 1,
                    totalFameEarned: state.totalFameEarned + fame,
                }));
            },
            applyDpsFame: (fameToAdd) => {
                set(state => ({
                    score: state.score + fameToAdd,
                    totalFameEarned: state.totalFameEarned + fameToAdd,
                    lastUpdated: Date.now(),
                }));
            },
            setPoison: (newPoisonState) => set({ poison: newPoisonState }),
            handleUseAbility: (abilityId, context) => {
                // Placeholder for ability logic
                console.log("Used ability:", abilityId, "with context:", context);
                // Set cooldown
                const ability = abilities.find(a => a.id === abilityId);
                if (ability) {
                    set(state => ({
                        abilityCooldowns: { ...state.abilityCooldowns, [abilityId]: Date.now() + ability.cooldown }
                    }));
                }
            },

            // --- Prestige Action ---
            handlePrestige: () => { /* ... your full prestige logic ... */ return true; },
        }),
        {
            name: 'pixel-clicker-save', // The key for localStorage
        }
    )
);

// This exports the function and makes it available for import, fixing the build error.
export const getOfflineProgress = () => {
    const { lastUpdated, pointsPerSecond } = useGameStore.getState();
    if (!lastUpdated || !pointsPerSecond) {
        return { fameEarned: 0, timeOffline: 0 };
    }
    const now = Date.now();
    const timeOfflineInSeconds = Math.floor((now - lastUpdated) / 1000);
    const maxOfflineTime = 24 * 60 * 60; // 24 hours
    const effectiveTimeOffline = Math.min(timeOfflineInSeconds, maxOfflineTime);
    const fameEarned = Math.floor(effectiveTimeOffline * pointsPerSecond);
    return { fameEarned, timeOffline: effectiveTimeOffline };
};
