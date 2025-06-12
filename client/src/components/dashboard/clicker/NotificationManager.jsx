import React, { useEffect } from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { achievements } from '../../../data/achievements';
import toast from 'react-hot-toast';

/**
 * This component handles showing notifications in a way that is safe for React's render cycle.
 * It doesn't render any visible UI itself, it just manages toasts.
 */
export function NotificationManager() {
    // Subscribe to the two pieces of state we need
    const { lastUnlockedAchievement, acknowledgeAchievement } = useGameStore(state => ({
        lastUnlockedAchievement: state.lastUnlockedAchievement,
        acknowledgeAchievement: state.acknowledgeAchievement,
    }));

    useEffect(() => {
        // If there's a newly unlocked achievement...
        if (lastUnlockedAchievement) {
            // Find the achievement's data
            const ach = achievements.find(a => a.id === lastUnlockedAchievement);
            if (ach) {
                // ...show the custom toast!
                toast.custom(
                    (t) => (
                        <div
                            className={`achievement-alert ${t.visible ? 'animate-enter' : 'animate-leave'}`}
                            onClick={() => toast.dismiss(t.id)}
                        >
                            <strong>🏆 Achievement Unlocked!</strong>
                            <p>{ach.name}</p>
                        </div>
                    ),
                    { duration: 4000, position: 'bottom-right' }
                );
            }
            // IMPORTANT: Tell the store we've shown the notification so it doesn't show it again!
            acknowledgeAchievement();
        }
    }, [lastUnlockedAchievement, acknowledgeAchievement]); // This effect runs only when a new achievement is unlocked

    // This component renders nothing! It's just a manager.
    return null;
}
