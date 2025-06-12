import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

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

            // === Getters / Calculators ===
            calculateAchievementBonuses: () => {
                const { unlockedAchievements } = get();
                const bonuses = { fameMultiplier: 1, shardMultiplier: 1 };
                for (const ach of achievements) {
                    if (unlockedAchievements[ach.id]) {
                        if (ach.reward.type === 'FAME_MULTIPLIER') {
                            bonuses.fameMultiplier += ach.reward.value;
                        } else if (ach.reward.type === 'SHARD_MULTIPLIER') {
                            bonuses.shardMultiplier += ach.reward.value;
                        }
                    }
                }
                return bonuses;
            },

            calculateDamageRange: () => {
                const { playerClass, currentBossIndex, upgradesOwned, temporaryUpgradesOwned, equippedWeapon, prestigeUpgradesOwned, activeBuffs } = get();
                const bossStage = `stage${Math.min(currentBossIndex + 1, 3)}`;
                const currentClassUpgradesForDamage = classUpgrades[bossStage]?.[playerClass] || [];
                const currentBossForDamage = bosses[currentBossIndex];

                let minDamage = 1;
                let maxDamage = 1;

                currentClassUpgradesForDamage.forEach(upgrade => {
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

                if (currentBossForDamage?.temporaryUpgrades) {
                    currentBossForDamage.temporaryUpgrades.forEach(tempUpgrade => {
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

                const prestigeDamageBonus = prestigeUpgradesOwned['permanentDamage'] || 0;
                const damageMultiplier = 1 + (prestigeDamageBonus * 0.10);
                minDamage *= damageMultiplier;
                maxDamage *= damageMultiplier;

                if(activeBuffs['arcane_power']) {
                    minDamage *= 2;
                    maxDamage *= 2;
                }
                return { minDamage: Math.floor(minDamage), maxDamage: Math.floor(maxDamage) };
            },

            // === Actions ===
            setGamePhase: (phase) => set({ gamePhase: phase }),
            setGameWon: (won) => set({ gameWon: won }),
            setIsHealing: (healing) => set({ isHealing: healing }),
            setIsInvulnerable: (invulnerable) => set({ isInvulnerable: invulnerable }),
            setPoison: (newPoisonState) => set({ poison: newPoisonState }),
            setActiveBuffs: (buffs) => set({ activeBuffs: buffs }),
            
            handleClassSelect: (className) => set({ playerClass: className, gamePhase: 'clicking' }),
            
            advanceToNextBoss: (isPortal) => {
                 set(state => ({
                     currentBossIndex: state.currentBossIndex + 1,
                     clicksOnCurrentBoss: 0,
                     temporaryUpgradesOwned: {},
                     triggeredHeals: {},
                     abilityCooldowns: isPortal ? {} : state.abilityCooldowns,
                 }));
                 if (!isPortal) {
                    get().playSound(bosses[get().currentBossIndex - 1]?.breakSound);
                 }
            },
            
            handleEnterPortal: () => {
                set(state => ({
                    currentBossIndex: state.currentBossIndex + 1,
                    clicksOnCurrentBoss: 0,
                    temporaryUpgradesOwned: {},
                    abilityCooldowns: {}
                }));
                set({ gamePhase: 'clicking' });
            },

            toggleMute: () => set(state => ({ isMuted: !state.isMuted })),
            
            playSound: (soundFile, volume = 1) => {
                if (!get().isMuted) {
                    try {
                        const audio = new Audio(soundFile);
                        audio.volume = volume;
                        audio.play().catch(() => {});
                    } catch (e) {}
                }
            },

            resetSave: () => {
                if (window.confirm("Are you sure? This will erase everything.")) {
                    set(defaultState);
                    set({ gamePhase: 'classSelection' });
                }
            },
            
            handleEquipWeapon: (weaponId) => {
                set({ equippedWeapon: weaponId });
                toast.success(`Equipped ${weapons.find(w => w.id === weaponId)?.name || 'Default Sword'}!`);
            },
            
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
            
            applyPoisonDamage: (damage) => set(state => ({ clicksOnCurrentBoss: state.clicksOnCurrentBoss + damage })),
            
            applyHealing: (amount) => set(state => ({ clicksOnCurrentBoss: Math.max(0, state.clicksOnCurrentBoss - amount) })),
            
            setTriggeredHeal: (bossId, percent) => {
                set(state => ({
                    triggeredHeals: {
                        ...state.triggeredHeals,
                        [bossId]: [...(state.triggeredHeals[bossId] || []), percent]
                    }
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
                            <div className={`achievement-alert ${t.visible ? 'animate-enter' : 'animate-leave'}`} onClick={() => toast.dismiss(t.id)}>
                                <strong>🏆 Achievement Unlocked!</strong>
                                <p>{ach.name}</p>
                            </div>
                        ));
                    }
                }
            },
            
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
                    toast.error("Not enough points, cutie!");
                }
            },
            
            handleBuyTemporaryUpgrade: (upgrade) => {
                const { score, temporaryUpgradesOwned } = get();
                const owned = temporaryUpgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.25, owned));
                if (score >= cost) {
                    set(state => ({
                        score: state.score - cost,
                        temporaryUpgradesOwned: { ...state.temporaryUpgradesOwned, [upgrade.id]: owned + 1 },
                    }));
                } else {
                    toast.error("Not enough Fame for that boost!");
                }
            },
            
            handleBuyPrestigeUpgrade: (upgrade) => {
                const { exaltedShards, prestigeUpgradesOwned } = get();
                const cost = Math.floor(upgrade.cost * Math.pow(1.5, prestigeUpgradesOwned[upgrade.id] || 0));
                if (exaltedShards >= cost) {
                    set(state => ({
                        exaltedShards: state.exaltedShards - cost,
                        prestigeUpgradesOwned: { ...state.prestigeUpgradesOwned, [upgrade.id]: (state.prestigeUpgradesOwned[upgrade.id] || 0) + 1 }
                    }));
                } else {
                    toast.error("Not enough Exalted Shards!");
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
                    toast.error("Not enough Exalted Shards!");
                }
            },
            
            handleUseAbility: (abilityId) => {
                const now = Date.now();
                const ability = abilities.find(a => a.id === abilityId);
                if (!ability || (get().abilityCooldowns[abilityId] || 0) > now) {
                    toast.error('Ability is on cooldown!');
                    return;
                }
                
                switch (abilityId) {
                    case 'slam': {
                        if (get().pointsPerSecond <= 0) {
                            toast.error("Slam would have no effect with 0 DPS!");
                            return;
                        }
                        const slamDamage = Math.floor(get().pointsPerSecond * 30);
                        const fameFromSlam = Math.floor(slamDamage * get().calculateAchievementBonuses().fameMultiplier);
                        get().applyClick(slamDamage, fameFromSlam);
                        toast.success('SLAM!', { icon: '💥' });
                        break;
                    }
                    case 'arcane_power': {
                        set(state => ({ activeBuffs: { ...state.activeBuffs, [ability.id]: { expiresAt: now + 10000 } } }));
                        toast('Arcane Power surges through you!', { icon: '✨' });
                        break;
                    }
                    case 'virulent_outbreak': {
                        if (get().equippedWeapon === 'stacking_vipers') {
                            set(state => ({ poison: { stacks: state.poison.stacks + 50, lastApplied: now } }));
                            toast('Poison surges!', { icon: '🧪' });
                        } else {
                            const flatDamage = 5000 * (get().currentBossIndex + 1);
                            const fameFromAbility = Math.floor(flatDamage * get().calculateAchievementBonuses().fameMultiplier);
                            get().applyClick(flatDamage, fameFromAbility);
                            toast.success('Affliction strikes!', { icon: '💀' });
                        }
                        break;
                    }
                    default: break;
                }
                set(state => ({ abilityCooldowns: { ...state.abilityCooldowns, [abilityId]: now + ability.cooldown * 1000 } }));
            },

            handlePrestige: () => {
                const { score } = get();
                const bonuses = get().calculateAchievementBonuses();
                const shardsToAward = Math.floor((score / 2500000) * bonuses.shardMultiplier);

                if (shardsToAward < 1) {
                    alert("You need a higher score to prestige! Try reaching at least 2,500,000 Fame.");
                    return false;
                }
                const isConfirmed = window.confirm(`Are you sure you want to prestige? You will earn ${shardsToAward} Exalted Shards, but your Fame, upgrades, and boss progress will reset.`);
                if (isConfirmed) {
                    const { prestigeUpgradesOwned, playerClass, isMuted, unlockedWeapons, totalClicks, totalFameEarned, unlockedAchievements } = get();
                    const startingFameLevel = prestigeUpgradesOwned['permanentFame'] || 0;
                    const startingPpsLevel = prestigeUpgradesOwned['permanentPPS'] || 0;
                    const startingScore = startingFameLevel * 1000;
                    const startingPps = startingPpsLevel * 50;

                    set({
                        ...defaultState,
                        playerClass,
                        isMuted,
                        unlockedWeapons,
                        exaltedShards: get().exaltedShards + shardsToAward,
                        prestigeUpgradesOwned,
                        score: startingScore,
                        pointsPerSecond: startingPps,
                        totalClicks,
                        totalFameEarned,
                        unlockedAchievements,
                        hasPrestiged: true,
                    });
                    get().setGameWon(false);
                    get().setGamePhase('clicking');
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

export const getOfflineProgress = () => {
    const { lastUpdated, pointsPerSecond } = useGameStore.getState();
    if (!lastUpdated || !pointsPerSecond) return { fameEarned: 0, timeOffline: 0 };
    const now = Date.now();
    const timeOfflineInSeconds = Math.floor((now - lastUpdated) / 1000);
    const maxOfflineTime = 2 * 24 * 60 * 60; // 48 hours
    const effectiveTimeOffline = Math.min(timeOfflineInSeconds, maxOfflineTime);
    const fameEarned = Math.floor(effectiveTimeOffline * pointsPerSecond * 0.50); // 50% offline efficiency
    return { fameEarned, timeOffline: effectiveTimeOffline };
};
