import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ====================================================================
// ✨ DATA STRUCTURES ✨
// ====================================================================

const classes = [
  { id: 'warrior', name: 'Warrior', image: '/warrior.png', emoji: '⚔️' },
  { id: 'wizard', name: 'Wizard', image: '/wizard.png', emoji: '🔮' },
  { id: 'sorcerer', name: 'Sorcerer', image: '/sorcerer.png', emoji: '🔪' },
];

const classUpgrades = {
  warrior: [
    { id: 'item1', name: 'Skysplitter Sword', image: '/skysplittersword.png', cost: 50, minBonus: 2, maxBonus: 5, type: 'perClick' },
    { id: 'item2', name: 'Golden Helm', image: '/goldenhelm.png', cost: 250, value: 2, type: 'perSecond', clickBonus: 1 },
    { id: 'item3', name: 'Ring of Exalted Dexterity', image: '/ringofexalteddexterity.png', cost: 750, value: 4, type: 'perSecond', clickBonus: 3 },
  ],
  wizard: [
    { id: 'item1', name: 'Staff of Astral Knowledge', image: '/staffofastralknowledge.png', cost: 50, minBonus: 1, maxBonus: 7, type: 'perClick' },
    { id: 'item2', name: 'Magic Nova Spell', image: '/magicnovaspell.png', cost: 250, value: 2, type: 'perSecond', clickBonus: 1 },
    { id: 'item3', name: 'Ring of Exalted Mana', image: '/ringofexaltedattack.png', cost: 750, value: 4, type: 'perSecond', clickBonus: 3 },
  ],
  sorcerer: [
    { id: 'item1', name: 'Wand of Ancient Power', image: '/wandofancientknowledge.png', cost: 50, minBonus: 3, maxBonus: 3, type: 'perClick' },
    { id: 'item2', name: 'Scepter of Skybolts', image: '/scepterofskybolts.png', cost: 250, value: 2, type: 'perSecond', clickBonus: 1 },
    { id: 'item3', name: 'Ring of Exalted Wisdom', image: '/ringofexalteddexterity.png', cost: 750, value: 4, type: 'perSecond', clickBonus: 3 },
  ],
};

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

const SAVE_GAME_KEY = 'realmmaid-clicker-game-save';

function PixelClickerGame() {
    const [gameState, setGameState] = useState(() => {
        const defaultState = {
            score: 0,
            pointsPerSecond: 0,
            currentBossIndex: 0,
            clicksOnCurrentBoss: 0,
            upgradesOwned: { item1: 0, item2: 0, item3: 0 },
            playerClass: null
        };
        const savedGame = localStorage.getItem(SAVE_GAME_KEY);
        if (savedGame) {
            const loadedState = { ...defaultState, ...JSON.parse(savedGame) };
            delete loadedState.pointsPerClick;
            return loadedState;
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

    const calculateDamageRange = () => {
        let minDamage = 1;
        let maxDamage = 1;
        const currentUpgrades = classUpgrades[gameState.playerClass] || [];
        currentUpgrades.forEach(upgrade => {
            const owned = gameState.upgradesOwned[upgrade.id] || 0;
            if (owned > 0) {
                if (upgrade.type === 'perClick') {
                    const bonus = Math.floor(Math.pow(owned, 0.9));
                    minDamage += upgrade.minBonus * bonus;
                    maxDamage += upgrade.maxBonus * bonus;
                } else if (upgrade.type === 'perSecond' && upgrade.clickBonus) {
                    const bonus = Math.floor(Math.pow(owned, 0.9));
                    minDamage += upgrade.clickBonus * bonus;
                    maxDamage += upgrade.clickBonus * bonus;
                }
            }
        });
        return { minDamage, maxDamage };
    };

    const handleGemClick = (event) => {
        if (gamePhase !== 'clicking' || !currentBoss) return;
        new Audio(currentBoss.clickSound).play();
        const { minDamage, maxDamage } = calculateDamageRange();
        const damageDealt = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
        setFloatingNumbers(current => [...current, {
            id: uuidv4(),
            value: damageDealt,
            x: event.clientX,
            y: event.clientY,
        }]);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 150);
        setGameState(prev => ({
            ...prev,
            score: prev.score + damageDealt,
            clicksOnCurrentBoss: prev.clicksOnCurrentBoss + damageDealt,
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

    const calculateUpgradeCost = (upgrade) => {
        const owned = gameState.upgradesOwned[upgrade.id] || 0;
        return Math.floor(upgrade.cost * Math.pow(1.15, owned));
    };

    const handleBuyUpgrade = (upgrade) => {
        const currentCost = calculateUpgradeCost(upgrade);
        if (gameState.score >= currentCost) {
            setGameState(prev => {
                const newOwned = { ...prev.upgradesOwned, [upgrade.id]: (prev.upgradesOwned[upgrade.id] || 0) + 1 };
                let newPps = prev.pointsPerSecond;
                if (upgrade.type === 'perSecond') {
                    newPps += upgrade.value;
                }
                return {
                    ...prev,
                    score: prev.score - currentCost,
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

    const getHealthPercent = () => {
        if (!currentBoss || gameWon) return gameWon ? 0 : 100;
        const percent = (gameState.clicksOnCurrentBoss / currentBoss.clickThreshold) * 100;
        return 100 - percent;
    };
    
    if (gamePhase === 'classSelection') {
        return (
            <div className="card">
                <div className="clicker-container">
                    <h3>Choose Your Class, Cutie!</h3>
                    <div className="class-selection-container" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                        {classes.map(pClass => (
                            <button key={pClass.id} className="btn-class-select" onClick={() => handleClassSelect(pClass.id)}>
                                <img src={pClass.image} alt={pClass.name} />
                                <span>{pClass.name} {pClass.emoji}</span>
                            </button>
                        ))}
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
            
            {(gamePhase === 'clicking' || gamePhase === 'transitioning') && (
                <div className="health-bar-container">
                    <div className="health-bar-inner" style={{ width: `${getHealthPercent()}%` }}></div>
                    <span className="health-bar-text">{Math.max(0, currentBoss.clickThreshold - gameState.clicksOnCurrentBoss)} / {currentBoss.clickThreshold}</span>
                </div>
            )}
            
            <div className="clicker-container">
                <h2>{Math.floor(gameState.score)} Sparkles ✨</h2>
                {gamePhase === 'clicking' && (
                    <p>{gameState.pointsPerSecond} sparkles per second / {calculateDamageRange().minDamage}-{calculateDamageRange().maxDamage} per click</p>
                )}

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
                        <div className="upgrades-grid">
                            {currentUpgrades.map(up => {
                                const cost = calculateUpgradeCost(up);
                                return (
                                    <button
                                        key={up.id}
                                        onClick={() => handleBuyUpgrade(up)}
                                        className="btn-upgrade"
                                        disabled={gameState.score < cost}
                                    >
                                        <img src={up.image} alt={up.name} className="upgrade-image" />
                                        <span className="upgrade-name">{up.name}</span>
                                        <small>Cost: {cost}</small>
                                        <small>(Owned: {gameState.upgradesOwned[up.id] || 0})</small>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PixelClickerGame;