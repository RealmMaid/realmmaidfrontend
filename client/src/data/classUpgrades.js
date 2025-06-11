export const classUpgrades = {
    stage1: {
        Warrior: [
            { id: 'item1', name: 'Skysplitter Sword', image: '/skysplittersword.png', cost: 35, minBonus: 3, maxBonus: 6, type: 'perClick' },
            { id: 'item2', name: 'Golden Helm', image: '/goldenhelm.png', cost: 200, value: 3, type: 'perSecond', clickBonus: 2 },
            { id: 'item3', name: 'Ring of Exalted Dexterity', image: '/ringofexalteddexterity.png', cost: 650, value: 8, type: 'perSecond', clickBonus: 4 },
        ],
        Wizard: [
            { id: 'item1', name: 'Staff of Astral Knowledge', image: '/staffofastralknowledge.png', cost: 40, minBonus: 1, maxBonus: 9, type: 'perClick' },
            { id: 'item2', name: 'Magic Nova Spell', image: '/magicnovaspell.png', cost: 225, value: 4, type: 'perSecond', clickBonus: 1 },
            { id: 'item3', name: 'Ring of Exalted Mana', image: '/ringofexaltedattack.png', cost: 700, value: 9, type: 'perSecond', clickBonus: 3 },
        ],
        Sorcerer: [
            { id: 'item1', name: 'Wand of Ancient Warning', image: '/woaw.png', cost: 50, minBonus: 4, maxBonus: 4, type: 'perClick' },
            { id: 'item2', name: 'Scepter of Skybolts', image: '/sos.png', cost: 180, value: 5, type: 'perSecond', clickBonus: 1 },
            { id: 'item3', name: 'Ring of Exalted Attack', image: '/ringofexaltedattack.png', cost: 750, value: 12, type: 'perSecond', clickBonus: 2 },
        ],
    },
    stage2: {
        Warrior: [
            { id: 'item4', name: 'Sword of Acclaim', image: '/soa.png', cost: 12000, minBonus: 40, maxBonus: 70, type: 'perClick' },
            { id: 'item5', name: 'Helm of the Great General', image: '/hotgg.png', cost: 55000, value: 250, type: 'perSecond', clickBonus: 25 },
            { id: 'item6', name: 'Ring of Unbound Attack', image: '/ringofunboundattack.png', cost: 160000, value: 600, type: 'perSecond', clickBonus: 60 },
        ],
        Wizard: [
            { id: 'item4', name: 'Staff of the Cosmic Whole', image: '/sotcw.png', cost: 13500, minBonus: 20, maxBonus: 120, type: 'perClick' },
            { id: 'item5', name: 'Elemental Detonation Spell', image: '/eds.png', cost: 60000, value: 300, type: 'perSecond', clickBonus: 20 },
            { id: 'item6', name: 'Ring of Unbound Dexterity', image: '/ringofunbounddexterity.png', cost: 175000, value: 650, type: 'perSecond', clickBonus: 55 },
        ],
        Sorcerer: [
            { id: 'item4', name: 'Wand of Recompense', image: '/wor.png', cost: 15000, minBonus: 55, maxBonus: 55, type: 'perClick' },
            { id: 'item5', name: 'Scepter of Storms', image: '/sos.png', cost: 50000, value: 350, type: 'perSecond', clickBonus: 22 },
            { id: 'item6', name: 'Ring of Unbound Attack', image: '/ringofunbounddexterity.png', cost: 180000, value: 800, type: 'perSecond', clickBonus: 40 },
        ],
    },
    stage3: {
        Warrior: [
            { id: 'item7', name: 'Pirate Kings Cutlass', image: '/pkc.png', cost: 450000, minBonus: 300, maxBonus: 600, type: 'perClick' },
            { id: 'item8', name: 'Hivemaster Helm', image: '/hivehelm.png', cost: 950000, value: 2500, type: 'perSecond', clickBonus: 200 },
            { id: 'item9', name: 'Battalion Banner', image: '/bb.png', cost: 2250000, value: 7000, type: 'perSecond', clickBonus: 500 },
        ],
        Wizard: [
            { id: 'item7', name: 'Superior', image: '/superior.png', cost: 500000, minBonus: 150, maxBonus: 850, type: 'perClick' },
            { id: 'item8', name: 'Genesis Spell', image: '/gs.png', cost: 1100000, value: 3000, type: 'perSecond', clickBonus: 150 },
            { id: 'item9', name: 'Chancellors Cranium', image: '/cc.png', cost: 2500000, value: 7500, type: 'perSecond', clickBonus: 450 },
        ],
        Sorcerer: [
            { id: 'item7', name: 'Lumiaire', image: '/lumi.png', cost: 550000, minBonus: 400, maxBonus: 400, type: 'perClick' },
            { id: 'item8', name: 'Scepter of Devastation', image: '/sod.png', cost: 900000, value: 3500, type: 'perSecond', clickBonus: 180 },
            { id: 'item9', name: 'Divine Coronation', image: '/dc.png', cost: 2800000, value: 10000, type: 'perSecond', clickBonus: 400 },
        ],
    },
};
