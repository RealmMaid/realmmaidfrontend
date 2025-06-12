import React from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { classes } from '../../../data/classes';

export function ClassSelection() {
    // This component only needs one action from our store: handleClassSelect.
    const handleClassSelect = useGameStore(state => state.handleClassSelect);

    return (
        <div className="card">
            <div className="clicker-container">
                <h3>Choose Your Class, Cutie!</h3>
                <div className="class-selection-container" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                    {classes.map(pClass => (
                        <button
                            key={pClass.id}
                            className="btn-class-select"
                            onClick={() => handleClassSelect(pClass.id)}
                        >
                            <img src={pClass.image} alt={pClass.name} />
                            <span>{pClass.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
