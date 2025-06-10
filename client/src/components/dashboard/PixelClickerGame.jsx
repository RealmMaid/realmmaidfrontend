import React, { useState, useEffect } from 'react';

// --- UPGRADES ---
// We can totally add more later!
const upgrades = [
  { id: 'polish', name: 'Sparkly Polish', cost: 50, value: 1, type: 'perClick' },
  { id: 'fairy', name: 'Helpful Fairy', cost: 250, value: 1, type: 'perSecond' },
  { id: 'golem', name: 'Gem Golem', cost: 1000, value: 5, type: 'perSecond' },
];

// This is the key we'll use to save the game in the browser!
const SAVE_GAME_KEY = 'realmmaid-clicker-game-save';

function PixelClickerGame() {
  // --- STATE ---
  // We try to load the saved game, or start a new one!
  const [gameState, setGameState] = useState(() => {
    const savedGame = localStorage.getItem(SAVE_GAME_KEY);
    if (savedGame) {
      return JSON.parse(savedGame);
    }
    return {
      score: 0,
      pointsPerClick: 1,
      pointsPerSecond: 0,
      purchasedUpgrades: {},
    };
  });

  // --- SAVING LOGIC ---
  // This special hook saves the game whenever the state changes! Magic!
  useEffect(() => {
    localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(gameState));
  }, [gameState]);


  // --- GAME LOOP ---
  // This hook runs our points-per-second logic!
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => ({ ...prev, score: prev.score + prev.pointsPerSecond }));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.pointsPerSecond]);


  // --- HANDLER FUNCTIONS ---
  const handleGemClick = () => {
    setGameState(prev => ({ ...prev, score: prev.score + prev.pointsPerClick }));
  };

  const handleBuyUpgrade = (upgrade) => {
    if (gameState.score >= upgrade.cost) {
      setGameState(prev => {
        const newScore = prev.score - upgrade.cost;
        let newPpc = prev.pointsPerClick;
        let newPps = prev.pointsPerSecond;

        if (upgrade.type === 'perClick') {
          newPpc += upgrade.value;
        } else if (upgrade.type === 'perSecond') {
          newPps += upgrade.value;
        }
        
        return {
          ...prev,
          score: newScore,
          pointsPerClick: newPpc,
          pointsPerSecond: newPps,
        };
      });
    } else {
      alert("Oopsie! Not enough points, cutie!");
    }
  };

  return (
    <div className="card">
      <h3>Realm Gem Clicker!</h3>
      <div className="clicker-container">
        
        <h2>{Math.floor(gameState.score)} Sparkles ✨</h2>
        <p>{gameState.pointsPerSecond} sparkles per second / {gameState.pointsPerClick} per click</p>
        
        {/* You can replace the emoji with your pixel art image! */}
        <div className="gem-button" onClick={handleGemClick}>
          {/* <img src="/your-art/gem.png" alt="Click me!" /> */}
          💎
        </div>

        <div className="upgrades-shop">
          <h4>Cute Upgrades!~</h4>
          {upgrades.map(up => (
            <button key={up.id} onClick={() => handleBuyUpgrade(up)} className="btn-upgrade">
              {up.name}
              <small>Cost: {up.cost}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PixelClickerGame;