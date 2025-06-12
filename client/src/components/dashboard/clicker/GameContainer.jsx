import React from 'react';

export function GameContainer() {
    return (
        <div style={{ color: 'white', padding: '2rem', border: '2px solid hotpink' }}>
            <h1>Game Container Loaded Successfully</h1>
            <p>
                There are no game loops or effects running in this version.
            </p>
            <p>
                If the application no longer crashes, the infinite loop is caused by the logic
                we had inside the real GameContainer.
            </p>
            <p>
                If the application STILL crashes with this component, the infinite loop is
                caused by a parent component.
            </p>
        </div>
    );
}
