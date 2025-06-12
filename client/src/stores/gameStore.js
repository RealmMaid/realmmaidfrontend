import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    notificationQueue: [],
    gamePhase: 'classSelection', // Game starts at class selection
    gameWon: false,
};

export const useGameStore = create(
    persist(
        (set, get) => ({
            ...defaultState,

            // ====================================================================
            // ACTIONS (LOGIC THAT MODIFIES STATE)
            // ====================================================================

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

            // --- Sound & Save Actions ---
            playSound: (soundFile, volume = 1) => {
                if (!get().isMuted) {
                    try {
                        const audio = new Audio(soundFile);
                        audio.volume = volume;
                        audio.play().catch(() => {});
                    } catch (e) {}
                }
            },
            toggleMute: () => set(state => ({ isMuted: !state.isMuted })),
            resetSave: () => {
                if (window.confirm("Are you sure? This will erase everything.")) {
                    set(defaultState);
                    localStorage.removeItem('pixel-clicker-save');
                }
            },

            // --- Purchase Handlers ---
            handleBuyUpgrade: (upgrade) => {
                const { score, upgradesOwned } = get();
                const owned = upgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));
                if (score < cost) return false;
                set(state => ({
                    score: state.score - cost,
                    pointsPerSecond: upgrade.type === 'perSecond' ? state.pointsPerSecond + upgrade.value : state.pointsPerSecond,
                    upgradesOwned: { ...state.upgradesOwned, [upgrade.id]: owned + 1 },
                }));
                return true;
            },
            handleBuyTemporaryUpgrade: (upgrade) => {
                const { score, temporaryUpgradesOwned } = get();
                const owned = temporaryUpgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.25, owned));
                if (score < cost) return false;
                set(state => ({
                    score: state.score - cost,
                    temporaryUpgradesOwned: { ...state.temporaryUpgradesOwned, [upgrade.id]: owned + 1 }
                }));
                return true;
            },
            handleBuyPrestigeUpgrade: (upgrade) => {
                const { exaltedShards, prestigeUpgradesOwned } = get();
                const owned = prestigeUpgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.5, owned));
                if (exaltedShards < cost) return false;
                set(state => ({
                    exaltedShards: state.exaltedShards - cost,
                    prestigeUpgradesOwned: { ...state.prestigeUpgradesOwned, [upgrade.id]: owned + 1 }
                }));
                return true;
            },
            handleUnlockWeapon: (weapon) => {
                if (get().exaltedShards < weapon.cost) return false;
                set(state => ({
                    exaltedShards: state.exaltedShards - weapon.cost,
                    unlockedWeapons: { ...state.unlockedWeapons, [weapon.id]: true }
                }));
                return true;
            },
            handleEquipWeapon: (weaponId) => set({ equippedWeapon: weaponId }),

            // --- Game Mechanic Handlers ---
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
                }));
            },
            applyPoisonDamage: (damage) => set(state => ({ clicksOnCurrentBoss: state.clicksOnCurrentBoss + damage })),
            applyHealing: (amount) => set(state => ({ clicksOnCurrentBoss: Math.max(0, state.clicksOnCurrentBoss - amount) })),
            setHealTrigger: (bossId, percent) => {
                set(state => ({
                    triggeredHeals: {
                        ...state.triggeredHeals,
                        [bossId]: [...(state.triggeredHeals[bossId] || []), percent]
                    }
                }));
            },
            checkForAchievementUnlocks: () => {
                const { unlockedAchievements } = get();
                const newUnlocks = [];
                for (const ach of achievements) {
                    if (!unlockedAchievements[ach.id] && ach.isUnlocked(get())) {
                        newUnlocks.push(ach);
                    }
                }
                if (newUnlocks.length > 0) {
                    set(state => ({
                        unlockedAchievements: { ...state.unlockedAchievements, ...newUnlocks.reduce((obj, ach) => ({ ...obj, [ach.id]: true }), {}) },
                        notificationQueue: [...state.notificationQueue, ...newUnlocks],
                    }));
                }
            },
            clearNotificationQueue: () => set({ notificationQueue: [] }),
            handlePrestige: () => {
                const { score, prestigeUpgradesOwned, playerClass, isMuted, unlockedWeapons } = get();
                const bonuses = get().calculateAchievementBonuses();
                const shardsToAward = Math.floor((score / 2500000) * bonuses.shardMultiplier);

                if (shardsToAward < 1) {
                    alert("You need a higher score to prestige!");
                    return false;
                }
                if (window.confirm(`Are you sure you want to prestige for ${shardsToAward} Exalted Shards?`)) {
                    const startingFameLevel = prestigeUpgradesOwned['permanentFame'] || 0;
                    const startingPpsLevel = prestigeUpgradesOwned['permanentPPS'] || 0;
                    set({
                        ...defaultState,
                        playerClass, isMuted, unlockedWeapons,
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
        }),
        {
            name: 'pixel-clicker-save',
        }
    )
);
