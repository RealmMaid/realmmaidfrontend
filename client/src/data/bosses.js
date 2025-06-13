export const bosses = [
            {
        id: 'ghost_king',
        name: 'Ghost King',
        images: ['/ghostking.png'], // You'll need to add this image!
        clickThreshold: 25000,
        isMiniBoss: true,
        lootTable: [
            { itemId: 'wizard_spellbook_of_ages', chance: 0.1 }
        ]
    },
    {
        id: 'skull_shrine',
        name: 'Skull Shrine',
        images: ['/skullshrine.png'], // You'll need to add this image!
        clickThreshold: 10000,
        isMiniBoss: true,
        lootTable: [
            { itemId: 'warrior_tome_of_might', chance: 0.1 } // 10% chance
        ]
    },
    {
        id: 'oryx1',
        name: 'Oryx the Mad God',
        images: ['/oryx.png'],
        clickThreshold: 45000,
        clickSound: '/oryxhit.mp3',
        breakSound: '/oryxdeath.mp3',
        portalImage: '/winecellar.png',
        healThresholds: [{ percent: 50, amount: 10000 }],
        temporaryUpgrades: [
            { id: 'temp_sharp_1', name: 'Sharpened Blade', cost: 1500, clickBonus: 5 },
            { id: 'temp_power_1', name: 'Power Crystal', cost: 7500, clickBonus: 30 },
        ]
    },
    {
        id: 'oryx2',
        name: 'Oryx the Mad God 2',
        images: ['/oryx2.png'],
        clickThreshold: 100000,
        clickSound: '/oryxhit.mp3',
        breakSound: '/oryxdeath.mp3',
        portalImage: '/oryxchamber.png',
        healThresholds: [{ percent: 75, amount: 20000 }, { percent: 40, amount: 25000 }],
        temporaryUpgrades: [
            { id: 'temp_ench_2', name: 'Minor Enchantment', cost: 25000, clickBonus: 150 },
            { id: 'temp_bless_2', name: 'Godly Blessing', cost: 100000, clickBonus: 650 },
        ]
    },
    {
        id: 'oryx3',
        name: 'Oryx the Mad God 3',
        images: ['/oryx3.png'],
        clickThreshold: 562500,
        clickSound: '/oryxhit.mp3',
        breakSound: '/oryxdeath.mp3',
        portalImage: null,
        healThresholds: [{ percent: 80, amount: 100000 }, { percent: 60, amount: 125000 }, { percent: 30, amount: 150000 }],
        temporaryUpgrades: [
            { id: 'temp_soul_3', name: 'Soul-Forged Edge', cost: 400000, clickBonus: 3000 },
            { id: 'temp_exalt_3', name: 'Exalted Strike', cost: 1500000, clickBonus: 12500 },
        ]
    },
    {
        id: 'oryxexalted',
        name: 'Oryx the Mad God Exalted',
        images: ['/oryxexalted.png'],
        clickThreshold: 1250000,
        clickSound: '/oryxhit.mp3',
        breakSound: '/oryxdeath.mp3',
        portalImage: null,
        healThresholds: [],
        temporaryUpgrades: [
            { id: 'temp_celestial_4', name: 'Celestial Shard', cost: 5000000, clickBonus: 40000 },
            { id: 'temp_divine_4', name: 'Divine Intervention', cost: 25000000, clickBonus: 200000 },
        ]
    },
];
