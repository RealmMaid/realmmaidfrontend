import React from 'react';
import { useGameStore } from '../../../stores/gameStore';

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

// The component receives the offline progress data and a function to close it.
export function WelcomeBackModal({ offlineProgress, onClose }) {
    // Get the action from the store to add the earned Fame
    const applyDpsFame = useGameStore(state => state.applyDpsFame);

    // If there's no offline progress to show, the component renders nothing.
    if (!offlineProgress || offlineProgress.fameEarned <= 0) {
        return null;
    }

    const handleClaim = () => {
        // 1. Give the player their earnings!
        applyDpsFame(offlineProgress.fameEarned);
        
        // 2. Now close the modal
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
