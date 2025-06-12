import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore.jsx';
import { Toaster } from 'react-hot-toast';
import { calculateOfflineProgress } from '../../utils/calculationUtils.js';
import { ClassSelection } from './clicker/ClassSelection';
import { GameContainer } from './clicker/GameContainer';
import { VictoryScreen } from './clicker/VictoryScreen';
import { Portal } from './clicker/Portal';
import { TransitionalScreen } from './clicker/TransitionalScreen';
import { WelcomeBackModal } from './clicker/WelcomeBackModal';

const useHydration = () => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsubFinishHydration = useGameStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useGameStore.persist.hasHydrated());
    return () => unsubFinishHydration();
  }, []);
  return hydrated;
};

function PixelClickerGame() {
    const isHydrated = useHydration();
    // Select only the single piece of state needed here
    const gamePhase = useGameStore((state) => state.gamePhase);
    const [offlineProgress, setOfflineProgress] = useState(null);

    useEffect(() => {
        const handleClassSelected = (event) => {
            const classId = event.detail;
            useGameStore.getState().handleClassSelect(classId);
        };
        window.addEventListener('class_selected', handleClassSelected);
        return () => window.removeEventListener('class_selected', handleClassSelected);
    }, []);

    useEffect(() => {
        if (isHydrated) {
            const { applyOfflineProgress } = useGameStore.getState();
            const progress = calculateOfflineProgress(useGameStore.getState());
            if (progress && progress.offlineEarnings > 0) {
                applyOfflineProgress(progress.offlineEarnings);
                setOfflineProgress(progress);
            }
        }
    }, [isHydrated]);

    if (!isHydrated) {
        return <div>Loading Game...</div>;
    }
    
    const renderGamePhase = () => {
        switch (gamePhase) {
            case 'classSelection': return <ClassSelection />;
            case 'clicking': return <GameContainer />;
            case 'transitioning': return <TransitionalScreen />;
            case 'exalted_transition': return <TransitionalScreen />;
            case 'portal': return <Portal />;
            case 'finished': return <VictoryScreen />;
            default: return <GameContainer />;
        }
    };

    return (
        <>
            <Toaster position="top-right" reverseOrder={false} />
            <WelcomeBackModal
                offlineProgress={offlineProgress}
                onClose={() => setOfflineProgress(null)}
            />
            <div className="game-wrapper">
                {renderGamePhase()}
            </div>
        </>
    );
}

export default PixelClickerGame;