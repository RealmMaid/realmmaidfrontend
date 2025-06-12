import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// A minimal default state to get us started
const defaultState = {
    score: 0,
    playerClass: null,
};

export const useGameStore = create(
    persist(
        (set, get) => ({
            ...defaultState,

            // The only two actions we need for this test
            setScore: (newScore) => set({ score: newScore }),
            handleClassSelect: (className) => set({ playerClass: className, gamePhase: 'clicking' }),
        }),
        {
            name: 'pixel-clicker-save',
            // The merge function is crucial for preventing errors on old saves
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...persistedState,
            }),
        }
    )
);
