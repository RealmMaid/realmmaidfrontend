// This is a list of all achievements in the game.
// The `isUnlocked` function takes the gameState and returns true if the condition is met.

export const achievements = [
  {
    id: 'click_100',
    name: 'Click Starter',
    description: 'Click a total of 100 times.',
    isUnlocked: (gameState) => gameState.totalClicks >= 100,
  },
  {
    id: 'click_1000',
    name: 'Click Enthusiast',
    description: 'Click a total of 1,000 times.',
    isUnlocked: (gameState) => gameState.totalClicks >= 1000,
  },
  {
    id: 'fame_10k',
    name: 'Fame and Fortune',
    description: 'Earn 10,000 total Fame.',
    isUnlocked: (gameState) => gameState.totalFameEarned >= 10000,
  },
  {
    id: 'fame_1m',
    name: 'Millionaire',
    description: 'Earn 1,000,000 total Fame.',
    isUnlocked: (gameState) => gameState.totalFameEarned >= 1000000,
  },
  {
    id: 'oryx1_defeated',
    name: 'Cellar Dweller',
    description: 'Defeat Oryx the Mad God 1.',
    // We check if the count for 'oryx1' is 1 or more.
    isUnlocked: (gameState) => (gameState.bossesDefeated.oryx1 || 0) >= 1,
  },
  {
    id: 'oryx3_defeated',
    name: 'Mad God Slayer',
    description: 'Defeat Oryx the Mad God 3.',
    isUnlocked: (gameState) => (gameState.bossesDefeated.oryx3 || 0) >= 1,
  },
  {
    id: 'prestige_1',
    name: 'A New Beginning',
    description: 'Prestige for the first time.',
    // We check if the player has *ever* prestiged.
    isUnlocked: (gameState) => gameState.hasPrestiged,
  },
];
