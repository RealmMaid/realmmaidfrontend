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
    pointsPerSecond: 0,
    famePerSecond: 0, // ✨ NEW: State to track passive fame generation!
    gamePhase: 'classSelection', // Can be: classSelection, clicking, transitioning, exalted_transition, finished
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


export const useGameStore = create(
    persist(
        (set, get) => ({
            ...defaultState,

            // =======================================
            // Main Game Actions
            // =======================================

            /**
             * Selects the player's class and starts the game.
             * @param {string} className - The ID of the class to select.
             */
            handleClassSelect: (className) => {
                set({ playerClass: className, gamePhase: 'clicking' });
            },

            /**
             * Applies damage and fame from a user's click.
             * @param {number} damageDealt - The amount of damage to deal to the boss.
             * @param {number} fameEarned - The amount of fame to award the player.
             */
            applyClick: (damageDealt, fameEarned) => {
                set(state => ({
                    score: state.score + fameEarned,
                    totalFameEarned: state.totalFameEarned + fameEarned,
                    clicksOnCurrentBoss: state.clicksOnCurrentBoss + damageDealt,
                    totalClicks: state.totalClicks + 1,
                }));
                get().checkAchievements(); // Check for new achievements after every click
            },
            
            /**
             * Applies damage and fame from the player's DPS/FPS every second.
             */
            applyDps: () => {
                const state = get();
                if ((state.pointsPerSecond <= 0 && state.famePerSecond <= 0) || state.isHealing || state.gamePhase !== 'clicking') return;

                let dps = state.pointsPerSecond;
                let fps = state.famePerSecond; // Get our new fame per second value

                // Apply modifiers
                if (state.equippedWeapon === 'executioners_axe') dps *= 0.5;
                if (state.activeBuffs['arcane_power']) dps *= 2;

                const bonuses = get().calculateAchievementBonuses();
                // ✨ UPDATED: Fame from FPS is now calculated separately
                const fameFromFps = Math.floor(fps * bonuses.fameMultiplier);
                
                const poisonDps = state.poison.stacks * (1 + Math.floor(state.currentBossIndex * 1.5));

                set(s => ({
                    // ✨ UPDATED: Add our passive fame gain to the score
                    score: s.score + fameFromFps,
                    totalFameEarned: s.totalFameEarned + fameFromFps,
                    // DPS and Poison still damage the boss
                    clicksOnCurrentBoss: s.clicksOnCurrentBoss + dps + poisonDps,
                }));
            },

            /**
             * Checks if the current boss has been defeated and updates the game phase.
             */
            checkBossDefeat: () => {
                const state = get();
                const currentBoss = bosses[state.currentBossIndex];
                if (!currentBoss || state.gamePhase !== 'clicking' || state.clicksOnCurrentBoss < currentBoss.clickThreshold) return;

                // Update defeat count and transition
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

            /**
             * Advances the game to the next boss after a transition screen.
             */
            handleTransitionEnd: () => {
                const state = get();
                const newBossIndex = state.gamePhase === 'exalted_transition' ? 3 : state.currentBossIndex + 1;
                set({
                    currentBossIndex: newBossIndex,
                    clicksOnCurrentBoss: 0,
                    gamePhase: 'clicking',
                    temporaryUpgradesOwned: {}, // Reset temp upgrades for the new boss
                });
            },

            // =======================================
            // Upgrade & Shop Actions
            // =======================================

            /**
             * Handles the purchase of a standard class upgrade.
             * @param {object} upgrade - The upgrade object from the data files.
             */
            handleBuyUpgrade: (upgrade) => {
                const state = get();
                const owned = state.upgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));

                if (state.score >= cost) {
                    set(s => ({
                        score: s.score - cost,
                        upgradesOwned: { ...s.upgradesOwned, [upgrade.id]: owned + 1 },
                        // ✨ UPDATED: Logic now checks the upgrade type!
                        famePerSecond: upgrade.type === 'perSecond' ? s.famePerSecond + upgrade.value : s.famePerSecond,
                        // We can leave pointsPerSecond for things that ONLY add DPS in the future
                    }));
                } else { 
                    toast.error("Not enough Fame!"); 
                }
            },

            /**
             * Handles the purchase of a temporary upgrade for the current boss.
             * @param {object} upgrade - The temporary upgrade object from the boss data.
             */
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
            
            /**
             * Handles the purchase of a permanent prestige upgrade.
             * @param {object} upgrade - The prestige upgrade object.
             */
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

            /**
             * Unlocks a weapon from the prestige shop.
             * @param {object} weapon - The weapon object to unlock.
             */
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

            /**
             * Calculates the player's current min and max click damage.
             * @returns {{minDamage: number, maxDamage: number}}
             */
            calculateDamageRange: () => {
                const state = get();
                let minDamage = 1, maxDamage = 1;
                const bonuses = state.calculateAchievementBonuses();
                const currentUpgrades = classUpgrades[`stage${Math.min(state.currentBossIndex + 1, 3)}`]?.[state.playerClass] || [];
                
                // Add damage from permanent upgrades
                currentUpgrades.forEach(up => {
                    const owned = state.upgradesOwned[up.id] || 0;
                    if (owned > 0) {
                        if (up.type === 'perClick') { minDamage += (up.minBonus || 0) * owned; maxDamage += (up.maxBonus || 0) * owned; }
                        else if (up.clickBonus) { minDamage += up.clickBonus * owned; maxDamage += up.clickBonus * owned; }
                    }
                });
                
                // Add damage from temporary upgrades
                const currentBoss = bosses[state.currentBossIndex];
                if (currentBoss?.temporaryUpgrades) {
                    currentBoss.temporaryUpgrades.forEach(tmpUp => {
                        const owned = state.temporaryUpgradesOwned[tmpUp.id] || 0;
                        if(owned > 0) { minDamage += tmpUp.clickBonus * owned; maxDamage += tmpUp.clickBonus * owned; }
                    });
                }
                
                // Apply weapon modifiers
                switch (state.equippedWeapon) {
                     case 'executioners_axe': minDamage *= 0.75; maxDamage *= 0.75; break;
                     case 'golden_rapier': minDamage *= 0.80; maxDamage *= 0.80; break;
                     case 'stacking_vipers': minDamage *= 0.20; maxDamage *= 0.20; break;
                }

                // Apply flat and percentage bonuses
                minDamage += bonuses.clickDamageFlat;
                maxDamage += bonuses.clickDamageFlat;
                const damageMultiplier = 1 + ((state.prestigeUpgradesOwned['permanentDamage'] || 0) * 0.10);
                minDamage *= damageMultiplier * bonuses.clickDamageMultiplier;
                maxDamage *= damageMultiplier * bonuses.clickDamageMultiplier;
                
                // Apply active buffs
                if (state.activeBuffs['arcane_power']) { minDamage *= 2; maxDamage *= 2; }
                
                return { minDamage: Math.floor(minDamage), maxDamage: Math.floor(maxDamage) };
            },
            
            /**
             * Calculates all bonuses granted by unlocked achievements.
             * @returns {object} An object containing all bonus multipliers and flat values.
             */
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

            /**
             * Iterates through achievements and unlocks any that meet their criteria.
             */
            checkAchievements: () => {
                const state = get();
                achievements.forEach(ach => {
                    if (!state.unlockedAchievements[ach.id] && ach.isUnlocked(state)) {
                        set(s => ({ unlockedAchievements: { ...s.unlockedAchievements, [ach.id]: true } }));
                        toast.custom(t => (
                            <div className={`achievement-alert ${t.visible ? 'animate-enter' : 'animate-leave'}`} onClick={() => toast.dismiss(t.id)}>
                                <strong>Achievement Unlocked!</strong>
                                <p>{ach.name}</p>
                            </div>
                        ), { duration: 4000 });
                    }
                });
            },

            // =======================================
            // Utility Actions
            // =======================================

            /**
             * Toggles the game's sound on or off.
             */
            toggleMute: () => set(state => ({ isMuted: !state.isMuted })),

            /**
             * Plays a sound effect if the game is not muted.
             * @param {string} soundUrl - The path to the sound file.
             * @param {number} volume - The volume to play the sound at (0.0 to 1.0).
             */
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

            /**
             * Updates the poison state on the boss.
             * @param {object} newPoisonState - The new state for the poison object.
             */
            setPoison: (newPoisonState) => set({ poison: newPoisonState }),
        }),
        {
            name: 'realmmaid-clicker-save', // The key for localStorage
            onRehydrate: (state) => {
                // You can add logic here that runs when the state is loaded
                console.log("Game state has been rehydrated from storage!");
            },
        }
    )
);
