import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Toaster } from 'react-hot-toast';
import EventBus from '../../EventBus';

// Import your REAL components from their separate files.
import { GameContainer } from './clicker/GameContainer';
import { ClassSelection } from './clicker/ClassSelection';
import { WelcomeBackModal } from './clicker/WelcomeBackModal';

export default function PixelClickerGame() {
    const { playerClass, setScore } = useGameStore(state => ({
        playerClass: state.playerClass,
        setScore: state.setScore,
    }));

    const [offlineProgress, setOfflineProgress] = useState(null);
    const [isLoaded, setIsLoaded] = useState(useGameStore.persist.hasHydrated);

    useEffect(() => {
        const onScoreUpdate = (newScore) => {
            // ✨ DEBUGGING LOG ADDED HERE ✨
            console.log(`%cReact: Heard scoreUpdated event! New score: ${newScore}`, 'color: #ffa500');
            setScore(newScore);
        };

        EventBus.on('scoreUpdated', onScoreUpdate);

        return () => {
            EventBus.off('scoreUpdated', onScoreUpdate);
        };
    }, [setScore]);

    useEffect(() => {
        const handleRehydration = () => {
            const getOfflineProgress = () => { 
                const { lastUpdated, pointsPerSecond } = useGameStore.getState();
                if (!lastUpdated || !pointsPerSecond) return { fameEarned: 0, timeOffline: 0 };
                const now = Date.now();
                const timeOfflineInSeconds = Math.floor((now - lastUpdated) / 1000);
                const maxOfflineTime = 2 * 24 * 60 * 60;
                const effectiveTimeOffline = Math.min(timeOfflineInSeconds, maxOfflineTime);
                const fameEarned = Math.floor(effectiveTimeOffline * pointsPerSecond * 0.50);
                return { fameEarned, timeOffline: effectiveTimeOffline };
            };
            const progress = getOfflineProgress();
            
            if (progress && progress.fameEarned > 0) {
                setOfflineProgress(progress);
            }
            setIsLoaded(true);
        };

        if (useGameStore.persist.hasHydrated()) {
            handleRehydration();
        } else {
            const unsubscribe = useGameStore.persist.onFinishRehydration(handleRehydration);
            return unsubscribe;
        }
    }, []);

    if (!isLoaded) {
        return <div className="loading-screen">Loading Your Game...</div>;
    }

    return (
        <>
            <Toaster position="top-right" />
            
            <WelcomeBackModal
                offlineProgress={offlineProgress}
                onClose={() => setOfflineProgress(null)}
            />

            {playerClass ? <GameContainer /> : <ClassSelection />}
        </>
    );
}
