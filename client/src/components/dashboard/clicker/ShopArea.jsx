import React, { useState } from 'react';

// We will create these components in the next steps!
// It's okay that they don't exist yet.
import { UpgradesShop } from './UpgradesShop';
import { PrestigeShop } from './PrestigeShop';
import { AchievementsList } from './AchievementsList';
import { Armory } from './Armory';

export function ShopArea() {
    // This local state only controls the UI, so it belongs here, not in the global store.
    const [activeShop, setActiveShop] = useState('upgrades');

    return (
        <>
            <div className="shop-toggle">
                <button
                    className={`btn-toggle ${activeShop === 'upgrades' ? 'active' : ''}`}
                    onClick={() => setActiveShop('upgrades')}
                >
                    Upgrades
                </button>
                <button
                    className={`btn-toggle ${activeShop === 'prestige' ? 'active' : ''}`}
                    onClick={() => setActiveShop('prestige')}
                >
                    Prestige
                </button>
                <button
                    className={`btn-toggle ${activeShop === 'achievements' ? 'active' : ''}`}
                    onClick={() => setActiveShop('achievements')}
                >
                    Achievements
                </button>
                <button
                    className={`btn-toggle ${activeShop === 'armory' ? 'active' : ''}`}
                    onClick={() => setActiveShop('armory')}
                >
                    Armory
                </button>
            </div>

            {/* Conditionally render the correct shop component based on the active tab */}
            <div className="shop-content">
                {activeShop === 'upgrades' && <UpgradesShop />}
                {activeShop === 'prestige' && <PrestigeShop />}
                {activeShop === 'achievements' && <AchievementsList />}
                {activeShop === 'armory' && <Armory />}
            </div>
        </>
    );
}
