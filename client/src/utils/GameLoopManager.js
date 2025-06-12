import { useGameStore } from '../stores/gameStore';

/**
 * GameLoopManager
 * A singleton object that manages the main game loop completely outside of the React component tree.
 * This prevents lifecycle-related race conditions and ensures a stable, consistent "tick" for the game.
 */
const GameLoopManager = {
  lastTime: 0,
  isStarted: false,

  /**
   * The main loop function, called by requestAnimationFrame.
   * @param {DOMHighResTimeStamp} currentTime - The current time provided by the browser.
   */
  loop(currentTime) {
    if (!this.lastTime) {
      this.lastTime = currentTime;
    }
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Directly get the latest versions of our logic functions from the Zustand store.
    const { gameTick, checkBossDefeat } = useGameStore.getState();

    // Call the store's logic functions. These functions have internal guards,
    // so they will only perform actions when the game is in the correct phase.
    gameTick(deltaTime);
    checkBossDefeat();

    // Continue the loop.
    requestAnimationFrame(this.loop.bind(this));
  },

  /**
   * Starts the global game loop. This should only be called once when the application loads.
   */
  start() {
    if (this.isStarted) {
      // This is a safeguard to ensure we don't accidentally start multiple loops.
      console.warn("GameLoopManager has already been started.");
      return;
    }
    console.log("🚀 Starting the global GameLoopManager.");
    this.isStarted = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }
};

export default GameLoopManager;
