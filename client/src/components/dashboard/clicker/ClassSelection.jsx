import React from 'react';
import { useGameStore } from '../../../stores/gameStore.jsx';
import { classes } from '../../../data/classes.js';

export function ClassSelection() {
    return (
        <div className="card">
            <div className="clicker-container">
                <h3>Choose Your Class, Cutie!</h3>
                <div className="class-selection-container" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                    {classes.map(pClass => (
                        <button
                            key={pClass.id}
                            className="btn-class-select"
                            // This is the most critical line. Ensure it calls getState().
                            onClick={() => useGameStore.getState().handleClassSelect(pClass.id)}
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
