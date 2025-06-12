import React from 'react';

// Import all the UI pieces that make up the main game screen.
import { Hud } from './Hud';
import { ShopArea } from './ShopArea';
import { AbilityBar } from './AbilityBar';

// This is our special component that hosts the Phaser canvas.
import PhaserGame from '../PhaserGame';

// This component's only job is to provide the layout for the active game screen.
export function GameContainer() {
    return (
        <div className="card">
            <div className="clicker-container">
                {/* The Heads-Up Display for score, etc. */}
                <Hud />

                <hr style={{margin: '1rem 0'}}/>

                {/* The container for our Phaser-powered boss display. */}
                <div className="boss-display-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <PhaserGame />
                </div>

                {/* The bar for the player's special ability. */}
                <AbilityBar />
                
                {/* The tabbed area for all the different shops. */}
                <ShopArea />
            </div>
        </div>
    );
}
