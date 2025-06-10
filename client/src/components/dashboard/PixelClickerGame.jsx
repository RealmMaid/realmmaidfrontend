import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ====================================================================
// ✨ BOSS AND UPGRADE DATA ✨
// ====================================================================
const bosses = [
  {
    id: 'oryx1',
    name: 'Oryx the Mad God',
    images: ['/oryx.png'],
    clickThreshold: 45000,
    clickSound: '/oryxhit.mp3',
    breakSound: '/oryxdeath.mp3',
  },
  {
    id: 'oryx2',
    name: 'Oryx the Mad God 2',
    images: ['/oryx2.png'],
    clickThreshold: 100000,
    clickSound: '/oryxhit.mp3',
    breakSound: '/oryxdeath.mp3',
  },
  {
    id: 'oryx3',
    name: 'Oryx the Mad God 3',
    images: ['/oryx3.png'],
    clickThreshold: 562500,
    clickSound: '/oryxhit.mp3',
    breakSound: '/oryxdeath.mp3',
  },
  {
    id: 'oryxexalted',
    name: 'Oryx the Mad God Exalted',
    images: ['/oryxexalted.png'],
    clickThreshold: 562500,
    clickSound: '/oryxhit.mp3',
    breakSound: '/oryxdeath.mp3',
  },
];

const classUpgrades = {
  warrior: [
    { id: 'item1', name: 'Skysplitter Sword', cost: 50, value: 1, type: 'perClick' },
    { id: 'item2', name: 'Golden Helm', cost: 250, value: 2, type: 'perSecond' },
    { id: 'item3', name: 'Ring of Exalted Dexterity', cost: 750, value: 4, type: 'perSecond' },
  ],
  wizard: [
    { id: 'item1', name: 'Staff of Astral Knowledge', cost: 50, value: 1, type: 'perClick' },
    { id: 'item2', name: 'Magic Nova Spell', cost: 250, value: 2, type: 'perSecond' },
    { id: 'item3', name: 'Ring of Exalted Mana', cost: 750, value: 4, type: 'perSecond' },
  ],
  sorcerer: [
    { id: 'item1', name: 'Wand of Ancient Power', cost: 50, value: 1, type: 'perClick' },
    { id: 'item2', name: 'Scepter of Skybolts', cost: 250, value: 2, type: 'perSecond' },
    { id: 'item3', name: 'Ring of Exalted Wisdom', cost: 750, value: 4, type: 'perSecond' },
  ],
};

const SAVE_GAME_KEY = 'realmmaid-clicker-game-save';

function PixelClickerGame() {
  const [gameState, setGameState] = useState(() => {
    // This is the perfect shape of our save file!
    const defaultState = { 
      score: 0, 
      pointsPerClick: 1, 
      pointsPerSecond: 0, 
      currentBossIndex: 0, 
      clicksOnCurrentBoss: 0, 
      upgradesOwned: { item1: 0, item2: 0, item3: 0 }, 
      playerClass: null 
    };

    const savedGame = localStorage.getItem(SAVE_GAME_KEY);

    if (savedGame) {
      // This combines the saved game with the default state,
      // so we never have missing pieces from old saves! So smart! owo
      return { ...defaultState, ...JSON.parse(savedGame) };
    }
    
    return defaultState;
  });

  const [gamePhase, setGamePhase] = useState(gameState.playerClass ? 'clicking' : 'classSelection');
  const [gameWon, setGameWon] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState([]);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    if (gamePhase !== 'clicking') return;
    const interval = setInterval(() => {
      setGameState(prev => ({ ...prev, score: prev.score + prev.pointsPerSecond }));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.pointsPerSecond, gamePhase]);

  const currentBoss = bosses[gameState.currentBossIndex];

  useEffect(() => {
    if (!currentBoss) return;
    if (gameState.clicksOnCurrentBoss >= currentBoss.clickThreshold && gamePhase === 'clicking') {
      if (gameState.currentBossIndex === bosses.length - 1) {
        new Audio(currentBoss.breakSound).play();
        setGameWon(true);
        setGamePhase('finished');
      } else {
        setGamePhase('transitioning');
        new Audio(currentBoss.breakSound).play();
        const timer = setTimeout(() => {
          setGamePhase('portal');
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.clicksOnCurrentBoss, currentBoss, gamePhase, gameState.currentBossIndex]);

  const handleClassSelect = (className) => {
    setGameState(prev => ({ ...prev, playerClass: className }));
    setGamePhase('clicking');
  };

  const handleGemClick = (event) => {
    if (gamePhase !== 'clicking' || !currentBoss) return;
    new Audio(currentBoss.clickSound).play();
    setFloatingNumbers(current => [...current, {
      id: uuidv4(),
      value: gameState.pointsPerClick,
      x: event.clientX,
      y: event.clientY,
    }]);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 150);
    setGameState(prev => ({
      ...prev,
      score: prev.score + prev.pointsPerClick,
      clicksOnCurrentBoss: prev.clicksOnCurrentBoss + 1,
    }));
  };

  const handleEnterPortal = () => {
    setGameState(prev => ({
      ...prev,
      currentBossIndex: prev.currentBossIndex + 1,
      clicksOnCurrentBoss: 0,
    }));
    setGamePhase('clicking');
  };

  // ✨ Helper function to calculate the new cost of an upgrade! ✨
  const calculateUpgradeCost = (upgrade) => {
    const owned = gameState.upgradesOwned[upgrade.id] || 0;
    // Price increases by 15% for each one you own!
    return Math.floor(upgrade.cost * Math.pow(1.15, owned));
  };

  // ✨ The super-smart function for buying upgrades! ✨
  const handleBuyUpgrade = (upgrade) => {
    const currentCost = calculateUpgradeCost(upgrade);
    if (gameState.score >= currentCost) {
      setGameState(prev => {
        const newOwned = { ...prev.upgradesOwned, [upgrade.id]: (prev.upgradesOwned[upgrade.id] || 0) + 1 };
        let newPpc = prev.pointsPerClick;
        let newPps = prev.pointsPerSecond;

        if (upgrade.type === 'perClick') newPpc += upgrade.value;
        else if (upgrade.type === 'perSecond') newPps += upgrade.value;
        
        return { 
          ...prev, 
          score: prev.score - currentCost, 
          pointsPerClick: newPpc, 
          pointsPerSecond: newPps,
          upgradesOwned: newOwned,
        };
      });
    } else {
      alert("Oopsie! Not enough points, cutie!");
    }
  };

  const getCurrentImage = () => {
    if (!currentBoss) return '';
    if (gameWon) {
      const finalBoss = bosses[bosses.length - 1];
      return finalBoss.images[finalBoss.images.length - 1];
    }
    const stageCount = currentBoss.images.length;
    const progress = Math.min(gameState.clicksOnCurrentBoss / currentBoss.clickThreshold, 1);
    const imageIndex = Math.min(Math.floor(progress * stageCount), stageCount - 1);
    return currentBoss.images[imageIndex];
  };

  if (gamePhase === 'classSelection') {
    return (
      <div className="card">
        <div className="clicker-container">
          <h3>Choose Your Class, Cutie!</h3>
          <div className="class-selection-container" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button className="btn-upgrade" onClick={() => handleClassSelect('warrior')}>Warrior ⚔️</button>
            <button className="btn-upgrade" onClick={() => handleClassSelect('wizard')}>Wizard 🔮</button>
            <button className="btn-upgrade" onClick={() => handleClassSelect('sorcerer')}>Sorcerer 🔪</button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentBoss) {
    return <div className="card"><p>Loading game...</p></div>;
  }
  
  const currentUpgrades = classUpgrades[gameState.playerClass] || [];

  return (
    <div className="card">
      {floatingNumbers.map(num => (
        <span
          key={num.id}
          className="floating-number"
          style={{ left: num.x, top: num.y }}
          onAnimationEnd={() => setFloatingNumbers(current => current.filter(n => n.id !== num.id))}
        >
          -{num.value}
        </span>
      ))}

      <h3>{gameWon ? 'You Did It!' : currentBoss.name}</h3>
      <div className="clicker-container">
        <h2>{Math.floor(gameState.score)} Sparkles ✨</h2>

        <div className="gem-button" onClick={handleGemClick}>
          <img
            src={getCurrentImage()}
            alt={currentBoss.name}
            className={`${gamePhase === 'transitioning' ? 'fading-out' : ''} ${isShaking ? 'shake' : ''}`}
          />
        </div>

        {gameWon && (
          <div className="portal-prompt">
            <h4>Congratulations, cutie! You beat the game! 💖</h4>
          </div>
        )}

        {gamePhase === 'portal' && (
          <div className="portal-prompt">
            <h4>A portal has opened! Do you enter?</h4>
            <button onClick={handleEnterPortal}>Enter!~</button>
          </div>
        )}

        {gamePhase === 'clicking' && (
          <div className="upgrades-shop">
            <h4>{gameState.playerClass}'s Upgrades!~</h4>
            {currentUpgrades.map(up => {
              const cost = calculateUpgradeCost(up); // We calculate the cost here!
              return (
                <button
                  key={up.id}
                  onClick={() => handleBuyUpgrade(up)}
                  className="btn-upgrade"
                  disabled={gameState.score < cost}
                >
                  {up.name}
                  {/* Now it shows the new cost and how many you own! */}
                  <small>Cost: {cost}</small>
                  <small>(Owned: {gameState.upgradesOwned[up.id] || 0})</small>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PixelClickerGame;