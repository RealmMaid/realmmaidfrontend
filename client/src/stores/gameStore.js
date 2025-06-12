import { create } from "zustand";
import { persist } from "zustand/middleware";

// Import all our game data so the store can use it
import { abilities } from "../data/abilities";
import { achievements } from "../data/achievements";
import { weapons } from "../data/weapons";
import { bosses } from "../data/bosses";
import { classUpgrades } from "../data/classUpgrades";
import { prestigeUpgrades } from "../data/prestigeUpgrades";

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
  equippedWeapon: "default",
  abilityCooldowns: {},
  totalClicks: 0,
  totalFameEarned: 0,
  bossesDefeated: {},
  unlockedAchievements: {},
  hasPrestiged: false,
  isMuted: false,
  notificationQueue: [],
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

      handleClassSelect: (className) => set({ playerClass: className }),

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      resetSave: () => {
        if (window.confirm("Are you sure? This will erase everything.")) {
          const playerClass = get().playerClass; // Keep class selection on reset
          set({ ...defaultState, playerClass });
        }
      },

      advanceToNextBoss: (isPortal) => {
        set((state) => ({
          currentBossIndex: state.currentBossIndex + 1,
          clicksOnCurrentBoss: 0,
          temporaryUpgradesOwned: {},
          abilityCooldowns: isPortal ? {} : state.abilityCooldowns,
        }));
      },

      // --- Purchase Handlers ---
      handleBuyUpgrade: (upgrade) => {
        const { score, upgradesOwned } = get();
        const owned = upgradesOwned[upgrade.id] || 0;
        const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));

        if (score >= cost) {
          set((state) => ({
            score: state.score - cost,
            pointsPerSecond:
              upgrade.type === "perSecond"
                ? state.pointsPerSecond + upgrade.value
                : state.pointsPerSecond,
            upgradesOwned: { ...state.upgradesOwned, [upgrade.id]: owned + 1 },
          }));
        } else {
          // UI logic like alerts will be handled in the component
          return false;
        }
        return true;
      },

      handleBuyTemporaryUpgrade: (upgrade) => {
        const { score, temporaryUpgradesOwned } = get();
        const owned = temporaryUpgradesOwned[upgrade.id] || 0;
        const cost = Math.floor(upgrade.cost * Math.pow(1.25, owned));
        if (score >= cost) {
          set((state) => ({
            score: state.score - cost,
            temporaryUpgradesOwned: {
              ...state.temporaryUpgradesOwned,
              [upgrade.id]: owned + 1,
            },
          }));
        } else {
          return false;
        }
        return true;
      },

      handleBuyPrestigeUpgrade: (upgrade) => {
        const { exaltedShards, prestigeUpgradesOwned } = get();
        const owned = prestigeUpgradesOwned[upgrade.id] || 0;
        const cost = Math.floor(upgrade.cost * Math.pow(1.5, owned));
        if (exaltedShards >= cost) {
          set((state) => ({
            exaltedShards: state.exaltedShards - cost,
            prestigeUpgradesOwned: {
              ...state.prestigeUpgradesOwned,
              [upgrade.id]: owned + 1,
            },
          }));
        } else {
          return false;
        }
        return true;
      },

      handleUnlockWeapon: (weapon) => {
        if (get().exaltedShards >= weapon.cost) {
          set((state) => ({
            exaltedShards: state.exaltedShards - weapon.cost,
            unlockedWeapons: { ...state.unlockedWeapons, [weapon.id]: true },
          }));
          return true;
        }
        return false;
      },

      // --- Game Mechanic Handlers ---
      handleEquipWeapon: (weaponId) => {
        set({ equippedWeapon: weaponId });
      },

      handleUseAbility: (abilityId) => {
        const now = Date.now();
        const { abilityCooldowns } = get();
        const ability = abilities.find((a) => a.id === abilityId);

        if (!ability || (abilityCooldowns[abilityId] || 0) > now) {
          return { success: false, reason: "cooldown" };
        }

        if (abilityId === "slam" && get().pointsPerSecond <= 0) {
          return { success: false, reason: "no_dps" };
        }

        set((state) => ({
          abilityCooldowns: {
            ...state.abilityCooldowns,
            [abilityId]: now + ability.cooldown * 1000,
          },
        }));

        return { success: true, ability };
      },

      handlePrestige: () => {
        const {
          score,
          prestigeUpgradesOwned,
          playerClass,
          isMuted,
          unlockedWeapons,
        } = get();
        const bonuses = get().calculateAchievementBonuses();
        const shardsToAward = Math.floor(
          (score / 2500000) * bonuses.shardMultiplier
        );

        if (shardsToAward < 1) {
          alert("You need a higher score to prestige!");
          return false;
        }
        if (
          window.confirm(
            `Are you sure you want to prestige for ${shardsToAward} Exalted Shards?`
          )
        ) {
          const startingFameLevel = prestigeUpgradesOwned["permanentFame"] || 0;
          const startingPpsLevel = prestigeUpgradesOwned["permanentPPS"] || 0;
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

      // --- State Updaters ---
      applyClick: (damage, fame) => {
        set((state) => ({
          score: state.score + fame,
          clicksOnCurrentBoss: state.clicksOnCurrentBoss + damage,
          totalClicks: state.totalClicks + 1,
          totalFameEarned: state.totalFameEarned + fame,
        }));
      },

      applyDpsFame: (fameToAdd) => {
        set((state) => ({
          score: state.score + fameToAdd,
          totalFameEarned: state.totalFameEarned + fameToAdd,
        }));
      },

      applyPoisonDamage: (damage) => {
        set((state) => ({
          clicksOnCurrentBoss: state.clicksOnCurrentBoss + damage,
        }));
      },

      applyHealing: (amount) => {
        set((state) => ({
          clicksOnCurrentBoss: Math.max(0, state.clicksOnCurrentBoss - amount),
        }));
        return { healedAmount: amount };
      },

      setHealTrigger: (bossId, percent) => {
        set((state) => ({
          triggeredHeals: {
            ...state.triggeredHeals,
            [bossId]: [...(state.triggeredHeals[bossId] || []), percent],
          },
        }));
      },

      // --- Achievement Logic ---
      checkForAchievementUnlocks: () => {
        const { unlockedAchievements } = get();
        const newUnlocks = [];
        for (const ach of achievements) {
          if (!unlockedAchievements[ach.id] && ach.isUnlocked(get())) {
            newUnlocks.push(ach);
          }
        }
        if (newUnlocks.length > 0) {
          set((state) => ({
            unlockedAchievements: {
              ...state.unlockedAchievements,
              ...newUnlocks.reduce(
                (obj, ach) => ({ ...obj, [ach.id]: true }),
                {}
              ),
            },
            notificationQueue: [...state.notificationQueue, ...newUnlocks],
          }));
        }
      },
      clearNotificationQueue: () => set({ notificationQueue: [] }),
    }),
    {
      name: "pixel-clicker-save",
    }
  )
);
