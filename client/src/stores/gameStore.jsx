import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

// Import all game data
import { bosses } from '../data/bosses';
import { classUpgrades } from '../data/classUpgrades';
import { achievements } from '../data/achievements';
import { weapons } from '../data/weapons';
import { prestigeUpgrades } from '../data/prestigeUpgrades';

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

export const useGameStore = create(
    persist(
        (set, get) => ({
            ...defaultState,

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

            applyDps: () => {
                const state = get();
                if (state.pointsPerSecond <= 0 || state.isHealing || state.gamePhase !== 'clicking') return;

                let dps = state.pointsPerSecond;
                if (state.equippedWeapon === 'executioners_axe') dps *= 0.5;
                if (state.activeBuffs['arcane_power']) dps *= 2;
                
                const bonuses = state.calculateAchievementBonuses();
                const fameFromDps = Math.floor(dps * bonuses.fameMultiplier);
                const poisonDps = state.poison.stacks * (1 + Math.floor(state.currentBossIndex * 1.5));

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

            handleBuyUpgrade: (upgrade) => {
                const state = get();
                const owned = state.upgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));

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

            calculateDamageRange: () => {
                // This function doesn't set state, so it needs no changes
                const state = get();
                // ... (rest of function is unchanged)
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
                        set(s => ({
                            unlockedAchievements: {
                                ...s.unlockedAchievements,
                                [ach.id]: true,
                            }
                        }));
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
        }),
        {
            name: 'realmmaid-clicker-save',
        }
    )
);
