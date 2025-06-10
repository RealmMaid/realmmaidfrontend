import React, { useState, useEffect } from 'react';

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
    clickThreshold: 100,
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
const upgrades = [
  { id: 'polish', name: 'Archon Sword', cost: 50, value: 1, type: 'perClick' },
  { id: 'fairy', name: 'Seal of the Holy Warrior', cost: 250, value: 2, type: 'perSecond' },
  { id: 'golem', name: 'Golden Helm', cost: 750, value: 3, type: 'perSecond' },
];

const SAVE_GAME_KEY = 'realmmaid-clicker-game-save';

function PixelClickerGame() {
  const [gameState, setGameState] = useState(() => {
    const savedGame = localStorage.getItem(SAVE_GAME_KEY);
    if (savedGame) return JSON.parse(savedGame);
    return { score: 0, pointsPerClick: 1, pointsPerSecond: 0, currentBossIndex: 0, clicksOnCurrentBoss: 0 };
  });

  const [gamePhase, setGamePhase] = useState('clicking');
  const [gameWon, setGameWon] = useState(false);

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

  const handleGemClick = () => {
    if (gamePhase !== 'clicking') return;
    new Audio(currentBoss.clickSound).play();
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
  
  // ✨ The function for buying upgrades goes here! ✨
  const handleBuyUpgrade = (upgrade) => {
    if (gameState.score >= upgrade.cost) {
      setGameState(prev => {
        const newScore = prev.score - upgrade.cost;
        let newPpc = prev.pointsPerClick;
        let newPps = prev.pointsPerSecond;

        if (upgrade.type === 'perClick') newPpc += upgrade.value;
        else if (upgrade.type === 'perSecond') newPps += upgrade.value;
        
        return { ...prev, score: newScore, pointsPerClick: newPpc, pointsPerSecond: newPps };
      });
    } else {
      alert("Oopsie! Not enough points, cutie!");
    }
  };

  const getCurrentImage = () => {
    if (gameWon) {
      const finalBoss = bosses[bosses.length - 1];
      return finalBoss.images[finalBoss.images.length - 1];
    }
    const stageCount = currentBoss.images.length;
    const progress = Math.min(gameState.clicksOnCurrentBoss / currentBoss.clickThreshold, 1);
    const imageIndex = Math.min(Math.floor(progress * stageCount), stageCount - 1);
    return currentBoss.images[imageIndex];
  };

  return (
    <div className="card">
      <h3>{gameWon ? 'You Did It!' : currentBoss.name}</h3>
      <div className="clicker-container">
        <h2>{Math.floor(gameState.score)} Sparkles ✨</h2>
        
        <div className="gem-button" onClick={handleGemClick}>
          <img src={getCurrentImage()} alt={currentBoss.name} className={gamePhase === 'transitioning' ? 'fading-out' : ''} />
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

        {/* ✨ Here's where we make the upgrade buttons show up! ✨ */}
        {gamePhase === 'clicking' && (
           <div className="upgrades-shop">
              <h4>Cute Upgrades!~</h4>
              {upgrades.map(up => (
                <button key={up.id} onClick={() => handleBuyUpgrade(up)} className="btn-upgrade">
                  {up.name}
                  <small>Cost: {up.cost}</small>
                </button>
              ))}
           </div>
        )}
      </div>
    </div>
  );
}

export default PixelClickerGame;