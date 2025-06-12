import React from 'react';

// Import the UI and the Game component
import { Hud } from './Hud';
import PhaserGame from '../PhaserGame';

// This component's only job is to structure the page.
export function GameContainer() {
    return (
        <div className="clicker-container">
            {/* 1. We render our React HUD component here */}
            <Hud />

            <hr style={{ margin: '1rem 0', borderColor: '#4a1566' }} />

            {/* 2. We render our Phaser Game component here */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PhaserGame />
            </div>
        </div>
    );
}
