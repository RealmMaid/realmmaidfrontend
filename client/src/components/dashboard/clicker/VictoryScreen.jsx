import React from 'react';
import { useGameStore } from '../../../stores/gameStore';

export function VictoryScreen() {
    // Get the prestige function from our store
    const handlePrestige = useGameStore(state => state.handlePrestige);
    const setGamePhase = useGameStore(state => state.setGamePhase);
    const setGameWon = useGameStore(state => state.setGameWon);

    const onPrestigeClick = () => {
        const prestiged = handlePrestige();
        if (prestiged) {
            // If prestige was successful, reset the game state
            setGameWon(false);
            setGamePhase('clicking');
        }
    };

    return (
        <div className="portal-prompt">
            <h4>Congratulations, cutie! You beat the game! 💖</h4>
            <button onClick={onPrestigeClick}>Prestige for Bonuses!~</button>
        </div>
    );
}
