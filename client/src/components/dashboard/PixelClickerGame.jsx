import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore, getOfflineProgress } from '../../stores/gameStore';
import toast, { Toaster } from 'react-hot-toast';

// Data imports (assuming these are in the correct path)
import { classes } from '../../data/classes';
import { abilities } from '../../data/abilities';
import { weapons } from '../../data/weapons';
import { bosses } from '../../data/bosses';
import { classUpgrades } from '../../data/classUpgrades';
import { prestigeUpgrades } from '../../data/prestigeUpgrades';
import { achievements } from '../../data/achievements';


// ==================================================================
// Helper & Child Components
// ==================================================================

// This is a helper function to make the time readable.
function formatTime(totalSeconds) {
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    let parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

    return parts.join(', ');
}


function WelcomeBackModal({ offlineProgress, onClose }) {
    // Get the action from the store that adds Fame
    const applyDpsFame = useGameStore(state => state.applyDpsFame);

    if (!offlineProgress || offlineProgress.fameEarned <= 0) {
        return null;
    }

    const handleClaim = () => {
        // 1. Add the earned fame to the player's score
        applyDpsFame(offlineProgress.fameEarned);
        
        // 2. Close the modal
        onClose();
    };
    
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Welcome Back!</h2>
                <p>You were away for <strong>{formatTime(offlineProgress.timeOffline)}</strong>.</p>
                <p>While you were gone, you earned:</p>
                <p className="modal-earnings">{Math.floor(offlineProgress.fameEarned).toLocaleString()} Fame!</p>
                <button onClick={handleClaim}>Awesome!</button>
            </div>
        </div>
    );
}


// --- Placeholder Components ---
function Hud() { return <div className="hud"> {/* HUD Elements like Score, PPS, etc. */} </div>; }
function ClassSelection() { return <div className="card"><h2>Select Your Class</h2>{/* Class options */}</div>; }
function BossDisplay() { return <div className="boss-display">{/* Boss image and health bar */}</div>; }
function AbilityBar() { return <div className="ability-bar">{/* Ability icons */}</div>; }
function ShopArea() { return <div className="shop-area">{/* Shop tabs */}</div>; }


function GameContainer() {
    // This is the main container for the active game.
    // It's responsible for running the game's core loops via useEffect.
    const pointsPerSecond = useGameStore(state => state.pointsPerSecond);
    const applyDpsFame = useGameStore(state => state.applyDpsFame);

    // Core DPS game loop
    useEffect(() => {
        if (pointsPerSecond > 0) {
            const interval = setInterval(() => {
                applyDpsFame(pointsPerSecond);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [pointsPerSecond, applyDpsFame]);
    
    // ... Other useEffects for Poison, Boss Health Checks, etc. would go here ...

    return (
        <div className="card">
            <div className="clicker-container">
                <Hud />
                <BossDisplay />
                <AbilityBar />
                <ShopArea />
            </div>
        </div>
    );
}

// ==================================================================
// Main Parent Component
// ==================================================================

function PixelClickerGame() {
    const playerClass = useGameStore(state => state.playerClass);
    const [offlineProgress, setOfflineProgress] = useState(null);
    const [isLoaded, setIsLoaded] = useState(useGameStore.persist.hasHydrated);

    // This useEffect correctly handles loading the offline progress
    useEffect(() => {
        const handleRehydration = () => {
            const progress = getOfflineProgress();
            // Only show the modal if the player actually earned something
            if (progress && progress.fameEarned > 0) {
                setOfflineProgress(progress);
            }
            setIsLoaded(true); // Mark the game as loaded
        };

        // If the game is already loaded when this component mounts, run the check.
        if (useGameStore.persist.hasHydrated()) {
            handleRehydration();
        } else {
            // Otherwise, wait for the 'rehydration' event to fire.
            // This returns an `unsubscribe` function which is called on cleanup.
            const unsubscribe = useGameStore.persist.onFinishRehydration(handleRehydration);
            return unsubscribe;
        }
    }, []); // Empty array ensures this runs only once on mount

    // While loading, you can show a loading screen or nothing at all
    if (!isLoaded) {
        // You can make this a fancy loading spinner component!
        return <div className="loading-screen">Loading Your Game...</div>;
    }

    return (
        <>
            <Toaster position="top-right" />
            {/* The modal will now appear correctly when offlineProgress is set */}
            {offlineProgress && (
                <WelcomeBackModal
                    offlineProgress={offlineProgress}
                    onClose={() => setOfflineProgress(null)}
                />
            )}
            {playerClass ? <GameContainer /> : <ClassSelection />}
        </>
    );
}

export default PixelClickerGame;
