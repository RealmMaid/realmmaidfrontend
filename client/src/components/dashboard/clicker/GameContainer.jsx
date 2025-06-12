import React from 'react';

// Import the UI components that DON'T depend on Phaser
import { Hud } from './Hud';
import { ShopArea } from './ShopArea';
import { AbilityBar } from './AbilityBar';
// We have REMOVED the import for PhaserGame

export function GameContainer() {
    return (
        <div className="card">
            <div className="clicker-container">
                <Hud />

                <hr style={{margin: '1rem 0'}}/>

                {/* We no longer render the PhaserGame component here */}
                <div className="boss-display-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                   {/* In the real app, the Phaser canvas goes here. For this test, it's empty. */}
                </div>

                <AbilityBar />
                
                <ShopArea />
            </div>
        </div>
    );
}