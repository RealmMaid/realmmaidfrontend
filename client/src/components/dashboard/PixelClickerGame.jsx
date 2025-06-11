import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ====================================================================
// ✨ DATA STRUCTURES ✨
// ====================================================================
const classes = [
  { id: 'Warrior', name: 'Warrior', image: '/warrior.png', emoji: '⚔️' },
  { id: 'Wizard', name: 'Wizard', image: '/wizard.png', emoji: '🔮' },
  { id: 'Sorcerer', name: 'Sorcerer', image: '/sorcerer.png', emoji: '🔪' },
];

const classUpgrades = {
  // Stage 1: For Oryx 1
  stage1: {
    Warrior: [
      { id: 'item1', name: 'Skysplitter Sword', image: '/skysplittersword.png', cost: 50, minBonus: 2, maxBonus: 5, type: 'perClick' },
      { id: 'item2', name: 'Golden Helm', image: '/goldenhelm.png', cost: 250, value: 2, type: 'perSecond', clickBonus: 1 },
      { id: 'item3', name: 'Ring of Exalted Dexterity', image: '/ringofexalteddexterity.png', cost: 750, value: 4, type: 'perSecond', clickBonus: 3 },
    ],
    Wizard: [
      { id: 'item1', name: 'Staff of Astral Knowledge', image: '/staffofastralknowledge.png', cost: 50, minBonus: 1, maxBonus: 7, type: 'perClick' },
      { id: 'item2', name: 'Magic Nova Spell', image: '/magicnovaspell.png', cost: 250, value: 2, type: 'perSecond', clickBonus: 1 },
      { id: 'item3', name: 'Ring of Exalted Mana', image: '/ringofexaltedattack.png', cost: 750, value: 4, type: 'perSecond', clickBonus: 3 },
    ],
    Sorcerer: [
      { id: 'item1', name: 'Wand of Ancient Power', image: '/wandofancientknowledge.png', cost: 50, minBonus: 3, maxBonus: 3, type: 'perClick' },
      { id: 'item2', name: 'Scepter of Skybolts', image: '/scepterofskybolts.png', cost: 250, value: 2, type: 'perSecond', clickBonus: 1 },
      { id: 'item3', name: 'Ring of Exalted Wisdom', image: '/ringofexalteddexterity.png', cost: 750, value: 4, type: 'perSecond', clickBonus: 3 },
    ],
  },
  // Stage 2: For Oryx 2
  stage2: {
    Warrior: [
        { id: 'item4', name: 'Sword of Acclaim', image: '/soa.png', cost: 10000, minBonus: 20, maxBonus: 50, type: 'perClick' },
        { id: 'item5', name: 'Helm of the Great General', image: '/hotgg.png', cost: 50000, value: 200, type: 'perSecond', clickBonus: 15 },
        { id: 'item6', name: 'Ring of Unbound Attack', image: '/ringofunboundattack.png', cost: 150000, value: 500, type: 'perSecond', clickBonus: 40 },
    ],
    Wizard: [
        { id: 'item4', name: 'Staff of the Cosmic Whole', image: '/sotcw.png', cost: 10000, minBonus: 10, maxBonus: 70, type: 'perClick' },
        { id: 'item5', name: 'Elemental Detonation Spell', image: '/eds.png', cost: 50000, value: 220, type: 'perSecond', clickBonus: 12 },
        { id: 'item6', name: 'Ring of Unbound Dexterity', image: '/ringofunbounddexterity.png', cost: 150000, value: 500, type: 'perSecond', clickBonus: 40 },
    ],
    Sorcerer: [
        { id: 'item4', name: 'Wand of Recompense', image: '/wor.png', cost: 10000, minBonus: 35, maxBonus: 35, type: 'perClick' },
        { id: 'item5', name: 'Scepter of Storms', image: '/sos.png', cost: 50000, value: 210, type: 'perSecond', clickBonus: 14 },
        { id: 'item6', name: 'Ring of Unbound Attack', image: '/ringofunbounddexterity.png', cost: 150000, value: 500, type: 'perSecond', clickBonus: 40 },
    ],
  },
  // Stage 3: For Oryx 3 and Exalted Oryx
  stage3: {
    Warrior: [
        { id: 'item7', name: 'Pirate Kings Cutlass', image: '/pkc.png', cost: 500000, minBonus: 200, maxBonus: 500, type: 'perClick' },
        { id: 'item8', name: 'Hivemaster Helm', image: '/hivehelm.png', cost: 2500000, value: 2000, type: 'perSecond', clickBonus: 150 },
        { id: 'item9', name: 'Battalion Banner', image: '/bb.png', cost: 7500000, value: 5000, type: 'perSecond', clickBonus: 400 },
    ],
    Wizard: [
        { id: 'item7', name: 'Superior', image: '/superior.png', cost: 500000, minBonus: 100, maxBonus: 700, type: 'perClick' },
        { id: 'item8', name: 'Genesis Spell', image: '/gs.png', cost: 2500000, value: 2200, type: 'perSecond', clickBonus: 120 },
        { id: 'item9', name: 'Chancellors Cranium', image: '/cc.png', cost: 7500000, value: 5000, type: 'perSecond', clickBonus: 400 },
    ],
    Sorcerer: [
        { id: 'item7', name: 'Lumiaire', image: '/lumi.png', cost: 500000, minBonus: 350, maxBonus: 350, type: 'perClick' },
        { id: 'item8', name: 'Scepter of Devastation', image: '/sod.png', cost: 2500000, value: 2100, type: 'perSecond', clickBonus: 140 },
        { id: 'item9', name: 'Divine Coronation', image: '/dc.png', cost: 7500000, value: 5000, type: 'perSecond', clickBonus: 400 },
    ],
  },
};


const bosses = [
    {
        id: 'oryx1',
        name: 'Oryx the Mad God',
        images: ['/oryx.png'],
        clickThreshold: 45000,
        clickSound: '/oryxhit.mp3',
        breakSound: '/oryxdeath.mp3',
        portalImage: '/winecellar.png',
        healThresholds: [{ percent: 50, amount: 10000 }]
    },
    {
        id: 'oryx2',
        name: 'Oryx the Mad God 2',
        images: ['/oryx2.png'],
        clickThreshold: 100000,
        clickSound: '/oryxhit.mp3',
        breakSound: '/oryxdeath.mp3',
        portalImage: '/oryxchamber.png',
        healThresholds: [{ percent: 75, amount: 20000 }, { percent: 40, amount: 25000 }]
    },
    {
        id: 'oryx3',
        name: 'Oryx the Mad God 3',
        images: ['/oryx3.png'],
        clickThreshold: 562500,
        clickSound: '/oryxhit.mp3',
        breakSound: '/oryxdeath.mp3',
        portalImage: null,
        healThresholds: [{ percent: 80, amount: 100000 }, { percent: 60, amount: 125000 }, { percent: 30, amount: 150000 }]
    },
    {
        id: 'oryxexalted',
        name: 'Oryx the Mad God Exalted',
        images: ['/oryxexalted.png'],
        clickThreshold: 1250000,
        clickSound: '/oryxhit.mp3',
        breakSound: '/oryxdeath.mp3',
        portalImage: null,
        healThresholds: []
    },
];

const GAME_PHASES = {
  CLASS_SELECTION: 'classSelection',
  CLICKING: 'clicking',
  TRANSITIONING: 'transitioning',
  PORTAL: 'portal',
  FINISHED: 'finished',
};

const SAVE_GAME_KEY = 'realmmaid-clicker-game-save';

function PixelClickerGame() {
    const [gameState, setGameState] = useState(() => {
        const defaultState = {
            score: 0,
            pointsPerSecond: 0,
            currentBossIndex: 0,
            clicksOnCurrentBoss: 0,
            upgradesOwned: {},
            playerClass: null,
            triggeredHeals: {},
        };
        const savedGame = localStorage.getItem(SAVE_GAME_KEY);
        if (savedGame) {
            let loadedData = JSON.parse(savedGame);
            if (loadedData.playerClass && loadedData.playerClass === loadedData.playerClass.toLowerCase()) {
                loadedData.playerClass = loadedData.playerClass.charAt(0).toUpperCase() + loadedData.playerClass.slice(1);
            }
            const loadedState = { ...defaultState, ...loadedData };
            delete loadedState.pointsPerClick;
            return loadedState;
        }
        return defaultState;
    });

    const [gamePhase, setGamePhase] = useState(gameState.playerClass ? GAME_PHASES.CLICKING : GAME_PHASES.CLASS_SELECTION);
    const [gameWon, setGameWon] = useState(false);
    const [floatingNumbers, setFloatingNumbers] = useState([]);
    const [isShaking, setIsShaking] = useState(false);
    const [floatingHeals, setFloatingHeals] = useState([]);
    const [isHealing, setIsHealing] = useState(false);
    const gemButtonRef = useRef(null);

    const currentBoss = bosses[gameState.currentBossIndex];
    const bossStage = `stage${Math.min(gameState.currentBossIndex + 1, 3)}`;
    const currentUpgrades = classUpgrades[bossStage]?.[gameState.playerClass] || [];

    useEffect(() => {
        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(gameState));
    }, [gameState]);

    useEffect(() => {
        if (gamePhase !== GAME_PHASES.CLICKING || isHealing) return;
        const interval = setInterval(() => {
            setGameState(prev => ({ ...prev, score: prev.score + prev.pointsPerSecond }));
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState.pointsPerSecond, gamePhase, isHealing]);

    useEffect(() => {
        if (!currentBoss || gamePhase !== GAME_PHASES.CLICKING || isHealing) return;
        if (gameState.clicksOnCurrentBoss >= currentBoss.clickThreshold) {
            new Audio(currentBoss.breakSound).play();
            if (gameState.currentBossIndex === bosses.length - 1) {
                setGameWon(true);
                setGamePhase(GAME_PHASES.FINISHED);
            } else {
                if (currentBoss.id === 'oryx3') {
                    handleEnterPortal(); 
                } else {
                    setGamePhase(GAME_PHASES.TRANSITIONING);
                }
            }
        }
    }, [gameState.clicksOnCurrentBoss, gameState.currentBossIndex, currentBoss, gamePhase, isHealing]);

    useEffect(() => {
        if (gamePhase === GAME_PHASES.TRANSITIONING) {
            const timer = setTimeout(() => {
                setGamePhase(GAME_PHASES.PORTAL);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [gamePhase]);

    useEffect(() => {
        if (!currentBoss || !currentBoss.healThresholds || gamePhase !== GAME_PHASES.CLICKING || isHealing) {
            return;
        }
        const currentHealthPercent = 100 - (gameState.clicksOnCurrentBoss / currentBoss.clickThreshold) * 100;
        const triggeredHealsForBoss = gameState.triggeredHeals[currentBoss.id] || [];
        for (const heal of currentBoss.healThresholds) {
            if (currentHealthPercent <= heal.percent && !triggeredHealsForBoss.includes(heal.percent)) {
                setGameState(prev => ({
                    ...prev,
                    triggeredHeals: { ...prev.triggeredHeals, [currentBoss.id]: [...triggeredHealsForBoss, heal.percent] }
                }));
                setIsHealing(true);
                let amountHealed = 0;
                const healPerIncrement = 2500;
                const healInterval = setInterval(() => {
                    const healThisTick = Math.min(healPerIncrement, heal.amount - amountHealed);
                    amountHealed += healThisTick;
                    setGameState(prev => ({ ...prev, clicksOnCurrentBoss: Math.max(0, prev.clicksOnCurrentBoss - healThisTick) }));
                    if (gemButtonRef.current) {
                        const rect = gemButtonRef.current.getBoundingClientRect();
                        setFloatingHeals(current => [...current, {
                            id: uuidv4(), value: healThisTick,
                            x: rect.left + rect.width / 2 + (Math.random() * 80 - 40),
                            y: rect.top + (Math.random() * 20 - 10),
                        }]);
                    }
                    if (amountHealed >= heal.amount) {
                        clearInterval(healInterval);
                        setIsHealing(false);
                    }
                }, 200);
                break;
            }
        }
    }, [gameState.clicksOnCurrentBoss, currentBoss, gamePhase, isHealing, gameState.triggeredHeals]);

    const handleClassSelect = (className) => {
        setGameState(prev => ({ ...prev, playerClass: className }));
        setGamePhase(GAME_PHASES.CLICKING);
    };
    
    const calculateDamageRange = () => {
        let minDamage = 1;
        let maxDamage = 1;
        currentUpgrades.forEach(upgrade => {
            const owned = gameState.upgradesOwned[upgrade.id] || 0;
            if (owned > 0) {
                 const bonus = Math.floor(Math.pow(owned, 0.9));
                 if (upgrade.type === 'perClick') {
                    minDamage += (upgrade.minBonus || 0) * bonus;
                    maxDamage += (upgrade.maxBonus || 0) * bonus;
                } else if (upgrade.type === 'perSecond' && upgrade.clickBonus) {
                    minDamage += upgrade.clickBonus * bonus;
                    maxDamage += upgrade.clickBonus * bonus;
                }
            }
        });
        return { minDamage, maxDamage };
    };

    const handleGemClick = (event) => {
        if (gamePhase !== GAME_PHASES.CLICKING || !currentBoss || isHealing) return;
        new Audio(currentBoss.clickSound).play();
        const { minDamage, maxDamage } = calculateDamageRange();
        const damageDealt = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
        const rect = event.currentTarget.getBoundingClientRect();
        setFloatingNumbers(current => [...current, {
            id: uuidv4(), value: damageDealt,
            x: rect.left + rect.width / 2 + (Math.random() * 80 - 40),
            y: rect.top + (Math.random() * 20 - 10),
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
        setGamePhase(GAME_PHASES.CLICKING);
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
    
    const handleResetSave = () => {
        const isConfirmed = window.confirm(
            "Are you sure you want to reset all your progress? This action cannot be undone."
        );
        if (isConfirmed) {
            localStorage.removeItem(SAVE_GAME_KEY);
            window.location.reload();
        }
    };
    
    if (gamePhase === GAME_PHASES.CLASS_SELECTION) {
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
    
    return (
        <>
            <div className="card">
                {floatingNumbers.map(num => (
                    <span key={num.id} className="floating-number" style={{ left: num.x, top: num.y }} onAnimationEnd={() => setFloatingNumbers(current => current.filter(n => n.id !== num.id))}>
                        -{num.value}
                    </span>
                ))}
                {floatingHeals.map(num => (
                    <span key={num.id} className="floating-number heal" style={{ left: num.x, top: num.y }} onAnimationEnd={() => setFloatingHeals(current => current.filter(n => n.id !== num.id))}>
                        +{num.value}
                    </span>
                ))}
                
                <div className="clicker-container">
                    <h2>{Math.floor(gameState.score)} Sparkles ✨</h2>
                    {gamePhase === GAME_PHASES.CLICKING && (
                        <p>{gameState.pointsPerSecond} sparkles per second / {calculateDamageRange().minDamage}-{calculateDamageRange().maxDamage} per click</p>
                    )}

                    <h3 style={{ textAlign: 'center' }}>
                        {gameWon ? 'You Did It!' : currentBoss.name}
                        {isHealing && <span className="healing-indicator"> HEALING...</span>}
                    </h3>

                    <div className={`gem-button ${isHealing ? 'disabled' : ''}`} ref={gemButtonRef} onClick={handleGemClick}>
                        <img src={getCurrentImage()} alt={currentBoss.name} className={`${gamePhase === GAME_PHASES.TRANSITIONING ? 'fading-out' : ''} ${isShaking ? 'shake' : ''}`} />
                    </div>
                    
                    {(gamePhase === GAME_PHASES.CLICKING || gamePhase === GAME_PHASES.TRANSITIONING) && (
                        <div className="health-bar-container">
                            <div className="health-bar-inner" style={{ width: `${getHealthPercent()}%` }}></div>
                            <span className="health-bar-text">{Math.max(0, Math.floor(currentBoss.clickThreshold - gameState.clicksOnCurrentBoss))} / {currentBoss.clickThreshold}</span>
                        </div>
                    )}

                    {gameWon && (
                        <div className="portal-prompt">
                            <h4>Congratulations, cutie! You beat the game! 💖</h4>
                        </div>
                    )}

                    {gamePhase === GAME_PHASES.PORTAL && (
                        <div className="portal-prompt">
                            <img src={currentBoss.portalImage} alt="A mysterious portal" className="portal-image" />
                            <h4>A portal has opened! Do you enter?</h4>
                            <button onClick={handleEnterPortal}>Enter!~</button>
                        </div>
                    )}

                    {gamePhase === GAME_PHASES.CLICKING && (
                        <div className="upgrades-shop">
                            <h4>{gameState.playerClass}'s Upgrades!~</h4>
                            <div className="upgrades-grid">
                                {currentUpgrades.map(up => {
                                    const cost = calculateUpgradeCost(up);
                                    return (
                                        <button key={up.id} onClick={() => handleBuyUpgrade(up)} className="btn-upgrade" disabled={gameState.score < cost || isHealing}>
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

            <div style={{ textAlign: 'center', marginTop: '1rem', paddingBottom: '1rem' }}>
                 <button className="btn-reset" onClick={handleResetSave}>
                    Reset Save Data
                </button>
            </div>
        </>
    );
}

export default PixelClickerGame;
