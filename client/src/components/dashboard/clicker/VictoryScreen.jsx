import React from 'react';
import { useGameStore } from '../../../stores/gameStore.jsx';

export function VictoryScreen() {

    const onPrestigeClick = () => {
        // Call the action directly. It will handle all the state changes internally.
        useGameStore.getState().handlePrestige();
    };

    return (
        <div className="portal-prompt">
            <h4>Congratulations, cutie! You beat the game! 💖</h4>
            <button onClick={onPrestigeClick}>Prestige for Bonuses!~</button>
        </div>
    );
}
