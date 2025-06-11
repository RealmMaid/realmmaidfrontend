export const weapons = [
  {
    id: 'executioners_axe',
    name: 'Executioner\'s Axe',
    description: 'A weighty axe that trades speed for overwhelming power.',
    pro_con: [
      { type: 'pro', text: '+10% chance for a 10x damage critical hit.' },
      { type: 'con', text: '-25% non-critical click damage.' },
      { type: 'con', text: '-50% damage per second (DPS).' },
    ],
    cost: 10, // Exalted Shards to unlock
  },
  {
    id: 'golden_rapier',
    name: 'Golden Rapier',
    description: 'A gilded blade that uncovers more treasure from your foes.',
    pro_con: [
      { type: 'pro', text: '+25% to all Fame earned.' },
      { type: 'con', text: '-20% damage dealt to boss health.' },
    ],
    cost: 10, // Exalted Shards to unlock
  },
  {
    id: 'stacking_vipers',
    name: 'Stacking Vipers',
    description: 'Twin daggers coated in a virulent toxin that eats away at your target.',
    pro_con: [
      { type: 'pro', text: 'Clicks apply stacking Poison.' },
      { type: 'pro', text: 'Poison deals massive damage over time.' },
      { type: 'con', text: '-80% direct click damage.' },
    ],
    cost: 15, // More complex, so a bit more expensive
  },
];
