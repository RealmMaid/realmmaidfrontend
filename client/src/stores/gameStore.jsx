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

            // Public-facing actions now call the "private" implementation functions
            applyOfflineProgress: (earnings) => _applyOfflineProgress(set, get, earnings),
            applyClick: (damage, fame) => _applyClick(set, get, damage, fame),
            handleClassSelect: (className) => _handleClassSelect(set, get, className),
            handleUseAbility: (abilityId, context) => _handleUseAbility(set, get, abilityId, context),

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
                set(s => ({ bossesDefeated: { ...s.bossesDefeated, [currentBoss.id]: (s.bossesDefeated[currentBoss.id] || 0) + 1 } }));
                if (currentBoss.id === 'oryx3') { set({ gamePhase: 'exalted_transition' }); }
                else if (state.currentBossIndex === bosses.length - 1) { set({ gameWon: true, gamePhase: 'finished' }); }
                else { set({ gamePhase: 'transitioning' }); }
                get().checkAchievements();
            },
            
            handleBuyUpgrade: (upgrade) => {
                const state = get();
                const owned = state.upgradesOwned[upgrade.id] || 0;
                const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));
                if (state.score >= cost) {
                    set(s => ({
                        score: s.score - cost,
                        upgradesOwned: { ...s.upgradesOwned, [upgrade.id]: (s.upgradesOwned[upgrade.id] || 0) + 1 },
                        pointsPerSecond: upgrade.type === 'perSecond' ? s.pointsPerSecond + upgrade.value : s.pointsPerSecond,
                    }));
                } else { toast.error("Not enough Fame!"); }
            },
            
            calculateDamageRange: () => {
                const state = get();
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
                        set(s => ({ unlockedAchievements: { ...s.unlockedAchievements, [ach.id]: true } }));
                        toast.custom(t => (
                            <div className={`achievement-alert ${t.visible ? 'animate-enter' : 'animate-leave'}`} onClick={() => toast.dismiss(t.id)}>
                                <strong>🏆 Achievement Unlocked!</strong>
                                <p>{ach.name}</p>
                            </div>
                        ));
                    }
                });
            },
        }),
        {
            name: 'realmmaid-clicker-save',
        }
    )
);