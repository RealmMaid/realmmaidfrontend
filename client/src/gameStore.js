import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultState = {
    // --- State for React UI ---
    score: 0,
    exaltedShards: 0,
    isMuted: false,

    // --- State for Game Flow ---
    playerClass: null, // Determines if we show ClassSelection or the game
    
    // --- State needed for re-integrating features later ---
    upgradesOwned: {},
    prestigeUpgradesOwned: {},
    unlockedWeapons: {},
    equippedWeapon: 'default',
};

export const useGameStore = create(
    persist(
        (set) => ({
            ...defaultState,

            // === ACTIONS FOR REACT UI TO CALL ===

            // Called by the EventBus when Phaser updates the score
            setScore: (newScore) => set({ score: newScore }),

            // Called when a class is selected
            handleClassSelect: (className) => set({ playerClass: className }),

            // Called by the Mute button in the HUD
            toggleMute: () => set(state => ({ isMuted: !state.isMuted })),

            // Called when an upgrade is purchased
            // Note: The cost is deducted in Phaser, this just updates the record for the UI
            setUpgradeOwned: (upgradeId) => {
                set(state => ({
                    upgradesOwned: {
                        ...state.upgradesOwned,
                        [upgradeId]: (state.upgradesOwned[upgradeId] || 0) + 1,
                    }
                }));
            },
        }),
        {
            name: 'pixel-clicker-save-phaser', // New save key for the new version
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...persistedState,
            }),
        }
    )
);
