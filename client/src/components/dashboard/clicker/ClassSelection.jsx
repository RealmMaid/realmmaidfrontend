import React from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { classes } from '../../../data/classes';

/**
 * ClassSelection Component
 * This is the first screen the player sees, allowing them to choose a class.
 */
export function ClassSelection() {
    // We only need to get the action from the store to handle the selection.
    const handleClassSelect = useGameStore(state => state.handleClassSelect);

    return (
        <div className="class-selection-container" style={{ textAlign: 'center' }}>
            <h2>Choose Your Class!</h2>
            <p>Select a hero to begin your adventure!</p>
            <div className="class-grid" style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '2rem', 
                marginTop: '2rem' 
            }}>
                {classes.map(character => (
                    <div 
                        key={character.id} 
                        className="class-card" 
                        onClick={() => handleClassSelect(character.id)}
                        style={{
                            cursor: 'pointer',
                            border: '2px solid #555',
                            borderRadius: '10px',
                            padding: '1rem',
                            transition: 'all 0.2s ease-in-out'
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = '#fff'}
                        onMouseOut={e => e.currentTarget.style.borderColor = '#555'}
                    >
                        <img 
                            src={character.image} 
                            alt={character.name} 
                            style={{ width: '100px', height: '100px' }} 
                        />
                        <h3 style={{ marginTop: '1rem' }}>{character.name}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
}