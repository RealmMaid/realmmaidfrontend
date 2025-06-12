import React from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { weapons } from '../../../data/weapons';
import { bosses } from '../../../data/bosses';

// A cute little component for each stat!
const StatItem = ({ label, value, icon }) => (
    <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '1rem',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '1.5rem' }}>{icon}</div>
        <div style={{ marginTop: '0.5rem', fontSize: '1.25rem', color: '#fff', fontWeight: 'bold' }}>
            {value}
        </div>
        <div style={{ color: '#aaa', fontSize: '0.9rem' }}>{label}</div>
    </div>
);

export function StatsPage() {
    // Select all the stats we need from the store
    const {
        totalFameEarned,
        totalClicks,
        bossesDefeated,
        weaponUsageTime,
    } = useGameStore(state => ({
        totalFameEarned: state.totalFameEarned,
        totalClicks: state.totalClicks,
        bossesDefeated: state.bossesDefeated,
        weaponUsageTime: state.weaponUsageTime,
    }));

    // Calculate total number of bosses defeated
    const totalBossesDefeated = Object.values(bossesDefeated).reduce((sum, count) => sum + count, 0);

    // Find the favorite weapon
    const getFavoriteWeapon = () => {
        if (Object.keys(weaponUsageTime).length === 0) {
            return 'None yet!';
        }
        const favoriteWeaponId = Object.keys(weaponUsageTime).reduce((a, b) =>
            weaponUsageTime[a] > weaponUsageTime[b] ? a : b
        );
        const weaponData = weapons.find(w => w.id === favoriteWeaponId);
        return weaponData ? weaponData.name : 'Unknown';
    };

    return (
        <div className="stats-page" style={{ color: '#eee' }}>
            <h4 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Lifetime Stats</h4>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem'
            }}>
                <StatItem
                    label="Lifetime Fame"
                    value={Math.floor(totalFameEarned).toLocaleString()}
                    icon="💰"
                />
                <StatItem
                    label="Total Clicks"
                    value={totalClicks.toLocaleString()}
                    icon="🖱️"
                />
                <StatItem
                    label="Bosses Defeated"
                    value={totalBossesDefeated.toLocaleString()}
                    icon="💀"
                />
                <StatItem
                    label="Favorite Weapon"
                    value={getFavoriteWeapon()}
                    icon="⚔️"
                />
            </div>
        </div>
    );
}
