/**
 * specialItems.js
 * This file contains the definitions for rare items dropped by bosses.
 * These items provide permanent, passive stat boosts.
 */
export const specialItems = [
    // Warrior Items
    {
        id: 'warrior_tome_of_might',
        name: 'Tome of Might',
        description: '+5% to all click damage.',
        class: 'Warrior',
        bonus: { type: 'CLICK_DAMAGE_MULTIPLIER', value: 0.05 }
    },
    // Wizard Items
    {
        id: 'wizard_spellbook_of_ages',
        name: 'Spellbook of Ages',
        description: '+10% to all Fame Per Second.',
        class: 'Wizard',
        bonus: { type: 'FPS_MULTIPLIER', value: 0.10 }
    },
    // Sorcerer Items
    {
        id: 'sorcerer_scepter_of_souls',
        name: 'Scepter of Souls',
        description: 'Passive DPS deals 15% more damage.',
        class: 'Sorcerer',
        bonus: { type: 'DPS_MULTIPLIER', value: 0.15 }
    },
    // Universal Items (Can be used by any class)
    {
        id: 'universal_ring_of_power',
        name: 'Ring of Power',
        description: '+2% to all damage and Fame gained.',
        class: 'All',
        bonus: { type: 'GLOBAL_MULTIPLIER', value: 0.02 }
    }
];
