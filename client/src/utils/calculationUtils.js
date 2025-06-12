import {
    OFFLINE_EFFICIENCY_RATE,
    MAX_OFFLINE_SECONDS
} from '../constants';

/**
 * A pure utility function to calculate offline progress.
 * It has no dependency on Zustand's internals (`get` or `set`).
 * It simply takes the game state as an argument and returns a result.
 * @param {object} state The entire state object from the game store.
 * @returns {object|null} An object with progress details or null.
 */
export function calculateOfflineProgress(state) {
    if (state.lastSavedTimestamp && state.pointsPerSecond > 0) {
        const now = Date.now();
        const secondsOffline = Math.min(Math.floor((now - state.lastSavedTimestamp) / 1000), MAX_OFFLINE_SECONDS);

        if (secondsOffline > 10) {
            const offlineEarnings = Math.floor(secondsOffline * state.pointsPerSecond * OFFLINE_EFFICIENCY_RATE);
            return {
                secondsOffline,
                offlineEarnings
            };
        }
    }
    return null;
}
