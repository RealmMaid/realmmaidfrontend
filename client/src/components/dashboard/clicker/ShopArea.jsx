import React, { useState } from 'react';

// Import all our shop area components
import { UpgradesShop } from './UpgradesShop';
import { PrestigeShop } from './PrestigeShop';
import { AchievementsList } from './AchievementsList';
import { Armory } from './Armory';
import { StatsPage } from './StatsPage'; // ✨ NEW: Import the Stats Page

export function ShopArea() {
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
                {/* ✨ NEW: Add the Stats tab button */}
                <button
                    className={`btn-toggle ${activeShop === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveShop('stats')}
                >
                    Stats
                </button>
            </div>

            <div className="shop-content">
                {activeShop === 'upgrades' && <UpgradesShop />}
                {activeShop === 'prestige' && <PrestigeShop />}
                {activeShop === 'achievements' && <AchievementsList />}
                {activeShop === 'armory' && <Armory />}
                {/* ✨ NEW: Render the Stats Page when the tab is active */}
                {activeShop === 'stats' && <StatsPage />}
            </div>
        </>
    );
}
