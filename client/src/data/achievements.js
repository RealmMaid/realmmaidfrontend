export const achievements = [
  {
    id: 'click_1000',
    name: 'Click Enthusiast',
    description: 'Click a total of 1,000 times.',
    isUnlocked: (gameState) => gameState.totalClicks >= 1000,
    reward: { type: 'CLICK_DAMAGE_MULTIPLIER', value: 0.01 },
    rewardDescription: '+1% to all click damage.'
  },
  {
    id: 'fame_1m',
    name: 'Millionaire',
    description: 'Earn 1,000,000 total Fame.',
    isUnlocked: (gameState) => gameState.totalFameEarned >= 1000000,
    reward: { type: 'FAME_MULTIPLIER', value: 0.01 },
    rewardDescription: '+1% to all Fame earned.'
  },
  {
    id: 'oryx1_defeated',
    name: 'Cellar Dweller',
    description: 'Defeat Oryx the Mad God 1.',
    isUnlocked: (gameState) => (gameState.bossesDefeated.oryx1 || 0) >= 1,
    reward: { type: 'CLICK_DAMAGE_FLAT', value: 10 },
    rewardDescription: '+10 flat click damage.'
  },
  {
    id: 'oryx_exalted_defeated',
    name: 'Void Vanquisher',
    description: 'Defeat the Exalted Oryx.',
    isUnlocked: (gameState) => (gameState.bossesDefeated.oryxexalted || 0) >= 1,
    reward: { type: 'FAME_MULTIPLIER', value: 0.05 },
    rewardDescription: '+5% to all Fame earned.'
  },
  {
    id: 'prestige_1',
    name: 'A New Beginning',
    description: 'Prestige for the first time.',
    isUnlocked: (gameState) => gameState.hasPrestiged,
    reward: { type: 'SHARD_MULTIPLIER', value: 0.05 },
    rewardDescription: '+5% to all future Shard earnings.'
  },
];
