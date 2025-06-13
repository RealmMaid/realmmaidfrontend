import React, { useState } from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { weapons } from '../../../data/weapons';

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

// ✨ NEW: A confirmation modal component
const ConfirmationModal = ({ onConfirm, onCancel }) => (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
        <div style={{ background: '#2c1e38', padding: '2rem', borderRadius: '10px', textAlign: 'center', border: '1px solid #4a1566' }}>
            <h4 style={{ marginTop: 0 }}>Are you sure?</h4>
            <p>This will reset all your current run's progress, including fame and items!</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button onClick={onConfirm} className="btn-danger">Yes, Reset!</button>
                <button onClick={onCancel} className="btn-secondary">Nevermind</button>
            </div>
        </div>
    </div>
);


export function StatsPage() {
    // Select stats from the store
    const totalFameEarned = useGameStore(state => state.totalFameEarned);
    const totalClicks = useGameStore(state => state.totalClicks);
    const bossesDefeated = useGameStore(state => state.bossesDefeated);
    const weaponUsageTime = useGameStore(state => state.weaponUsageTime);
    const resetGame = useGameStore(state => state.resetGame);

    // ✨ NEW: Local state to control the modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const totalBossesDefeated = Object.values(bossesDefeated).reduce((sum, count) => sum + count, 0);

    const getFavoriteWeapon = () => {
        if (Object.keys(weaponUsageTime).length === 0) return 'None yet!';
        const favoriteWeaponId = Object.keys(weaponUsageTime).reduce((a, b) =>
            weaponUsageTime[a] > weaponUsageTime[b] ? a : b
        );
        const weaponData = weapons.find(w => w.id === favoriteWeaponId);
        return weaponData ? weaponData.name : 'Unknown';
    };

    const handleResetClick = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmReset = () => {
        resetGame();
        setShowConfirmModal(false);
    };

    return (
        <>
            {/* ✨ NEW: Render the modal when needed */}
            {showConfirmModal && <ConfirmationModal onConfirm={handleConfirmReset} onCancel={() => setShowConfirmModal(false)} />}
        
            <div className="stats-page" style={{ color: '#eee' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Lifetime Stats</h4>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem'
                }}>
                    <StatItem label="Lifetime Fame" value={Math.floor(totalFameEarned).toLocaleString()} icon="💰" />
                    <StatItem label="Total Clicks" value={totalClicks.toLocaleString()} icon="🖱️" />
                    <StatItem label="Bosses Defeated" value={totalBossesDefeated.toLocaleString()} icon="💀" />
                    <StatItem label="Favorite Weapon" value={getFavoriteWeapon()} icon="⚔️" />
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'center', borderTop: '1px solid #444', paddingTop: '2rem' }}>
                     <h5 style={{color: '#ff6b6b'}}>Danger Zone</h5>
                     <button onClick={handleResetClick} className="btn-danger">
                        Reset Progress
                     </button>
                     <p><small>This will start a new run but keep your prestige upgrades.</small></p>
                </div>
            </div>
        </>
    );
}
