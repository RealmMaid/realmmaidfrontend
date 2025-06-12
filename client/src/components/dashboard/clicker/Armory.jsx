import React from 'react';
import { useGameStore } from '../../../stores/gameStore';
import { weapons } from '../../../data/weapons';

export function Armory() {
    // Get the state and actions related to weapons from our store
    const {
        unlockedWeapons,
        equippedWeapon,
        handleEquipWeapon
    } = useGameStore(state => ({
        unlockedWeapons: state.unlockedWeapons,
        equippedWeapon: state.equippedWeapon,
        handleEquipWeapon: state.handleEquipWeapon,
    }));

    return (
        <div className="upgrades-shop">
            <h4>Armory</h4>
            <div className="armory-grid">
                {/* The default weapon is always available to equip */}
                <div
                    key="default"
                    className={`weapon-item ${equippedWeapon === 'default' ? 'equipped' : ''}`}
                    onClick={() => handleEquipWeapon('default')}
                >
                    <strong>Default Sword</strong>
                    <p>Your trusty, reliable blade. No special effects.</p>
                </div>

                {/* Map over the weapons data and only show the ones the player has unlocked */}
                {weapons.map(w => (
                    unlockedWeapons[w.id] && (
                        <div
                            key={w.id}
                            className={`weapon-item ${equippedWeapon === w.id ? 'equipped' : ''}`}
                            onClick={() => handleEquipWeapon(w.id)}
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
