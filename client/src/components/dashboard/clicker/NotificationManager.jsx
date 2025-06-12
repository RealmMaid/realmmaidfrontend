import React, { useEffect } from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { achievements } from '../../../data/achievements';
import toast from 'react-hot-toast';

/**
 * This component handles showing notifications in a way that is safe for React's render cycle.
 */
export function NotificationManager() {
    // ✨ THE FIX: We now select each piece of state separately.
    // This is a special Zustand trick that prevents the component from re-rendering
    // unless these specific values change. It's much more efficient!
    const lastUnlockedAchievement = useGameStore(state => state.lastUnlockedAchievement);
    const acknowledgeAchievement = useGameStore(state => state.acknowledgeAchievement);

    useEffect(() => {
        if (lastUnlockedAchievement) {
            const ach = achievements.find(a => a.id === lastUnlockedAchievement);
            if (ach) {
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
            // IMPORTANT: Tell the store we've shown the notification.
            acknowledgeAchievement();
        }
    }, [lastUnlockedAchievement, acknowledgeAchievement]);

    // This component renders nothing! It's just a manager.
    return null;
}