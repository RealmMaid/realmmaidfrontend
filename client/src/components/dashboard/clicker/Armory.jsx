import React from 'react';
import { useGameStore } from '../../../stores/gameStore.jsx';
import { weapons } from '../../../data/weapons.js';

export function Armory() {
    // Get the DATA we need to display the UI
    const {
        unlockedWeapons,
        equippedWeapon,
    } = useGameStore(state => ({
        unlockedWeapons: state.unlockedWeapons,
        equippedWeapon: state.equippedWeapon,
    }));

    return (
        <div className="upgrades-shop">
            <h4>Armory</h4>
            <div className="armory-grid">
                <div
                    key="default"
                    className={`weapon-item ${equippedWeapon === 'default' ? 'equipped' : ''}`}
                    onClick={() => useGameStore.getState().handleEquipWeapon('default')}
                >
                    <strong>Default Sword</strong>
                    <p>Your trusty, reliable blade. No special effects.</p>
                </div>

                {weapons.map(w => (
                    unlockedWeapons[w.id] && (
                        <div
                            key={w.id}
                            className={`weapon-item ${equippedWeapon === w.id ? 'equipped' : ''}`}
                            onClick={() => useGameStore.getState().handleEquipWeapon(w.id)}
                        >
                            <strong>{w.name}</strong>
                            <p>{w.description}</p>
                            <div className="weapon-pro-con">
                                {w.pro_con.map((eff, index) => (
                                    <small key={index} className={eff.type}>
                                        {eff.text}
                                    </small>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}
