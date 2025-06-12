import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

import { abilities } from '../data/abilities';
import { achievements } from '../data/achievements';
import { weapons } from '../data/weapons';
// ... other data imports

const defaultState = {
    // ... all other default state properties
    notificationQueue: [], // ✨ NEW: To hold pending achievement notifications
    isMuted: false,
};

export const useGameStore = create(
    persist(
        (set, get) => ({
            ...defaultState,

            // ... all your other actions like handleBuyUpgrade, etc. ...

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
                        unlockedAchievements: {
                            ...state.unlockedAchievements,
                            ...newUnlocks.reduce((obj, ach) => ({ ...obj, [ach.id]: true }), {})
                        },
                        // Add the new achievements to the queue instead of calling toast
                        notificationQueue: [...state.notificationQueue, ...newUnlocks],
                    }));
                }
            },

            // ✨ NEW: An action to clear the queue from the UI component
            clearNotificationQueue: () => set({ notificationQueue: [] }),
            
            // ... all your other actions ...
        }),
        {
            name: 'pixel-clicker-save',
        }
    )
);
