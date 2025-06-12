import React from 'react';
import { classes } from '../../../data/classes.js';

export function ClassSelection() {

    const handleClassClick = (classId) => {
        // 1. Create a new "CustomEvent". We can name it anything we want.
        // The 'detail' property is where we pass our data (the class ID).
        const event = new CustomEvent('class_selected', { detail: classId });

        // 2. Dispatch the event on the main window object.
        // The component's job is now done.
        window.dispatchEvent(event);
    };

    return (
        <div className="card">
            <div className="clicker-container">
                <h3>Choose Your Class, Cutie!</h3>
                <div className="class-selection-container" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                    {classes.map(pClass => (
                        <button
                            key={pClass.id}
                            className="btn-class-select"
                            onClick={() => handleClassClick(pClass.id)}
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
