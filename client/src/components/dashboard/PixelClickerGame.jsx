import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import toast, { Toaster } from "react-hot-toast";

// ✨ NEW: Importing all data from our new /data folder
import { classes } from "./data/classes";
import { abilities } from "./data/abilities";
import { achievements } from "./data/achievements";
import { weapons } from "./data/weapons";
import { bosses } from "./data/bosses";
import { classUpgrades } from "./data/classUpgrades";
import { prestigeUpgrades } from "./data/prestigeUpgrades";

// ====================================================================
// CONFIG & CONSTANTS
// ====================================================================

const OFFLINE_EFFICIENCY_RATE = 0.5;
const MAX_OFFLINE_SECONDS = 2 * 24 * 60 * 60;
const GAME_PHASES = {
  CLASS_SELECTION: "classSelection",
  CLICKING: "clicking",
  TRANSITIONING: "transitioning",
  PORTAL: "portal",
  FINISHED: "finished",
  EXALTED_TRANSITION: "exalted_transition",
};
const SAVE_GAME_KEY = "realmmaid-clicker-game-save";

const defaultState = {
  score: 0,
  pointsPerSecond: 0,
  currentBossIndex: 0,
  clicksOnCurrentBoss: 0,
  upgradesOwned: {},
  playerClass: null,
  triggeredHeals: {},
  exaltedShards: 0,
  prestigeUpgradesOwned: {},
  temporaryUpgradesOwned: {},
  unlockedWeapons: {},
  equippedWeapon: "default",
  abilityCooldowns: {},
  totalClicks: 0,
  totalFameEarned: 0,
  bossesDefeated: {},
  unlockedAchievements: {},
  hasPrestiged: false,
  lastSavedTimestamp: null,
  isMuted: false,
};

function formatTime(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  let parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  if (seconds > 0 || parts.length === 0)
    parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
  return parts.join(", ");
}

function PixelClickerGame() {
  const [offlineProgress, setOfflineProgress] = useState(null);
  const [gameState, setGameState] = useState(() => {
    const savedGame = localStorage.getItem(SAVE_GAME_KEY);
    if (savedGame) {
      let loadedData = JSON.parse(savedGame);
      if (loadedData.lastSavedTimestamp && loadedData.pointsPerSecond > 0) {
        const now = Date.now();
        const secondsOffline = Math.min(
          Math.floor((now - loadedData.lastSavedTimestamp) / 1000),
          MAX_OFFLINE_SECONDS
        );
        if (secondsOffline > 10) {
          const offlineEarnings = Math.floor(
            secondsOffline *
              loadedData.pointsPerSecond *
              OFFLINE_EFFICIENCY_RATE
          );
          loadedData.score += offlineEarnings;
          loadedData.totalFameEarned += offlineEarnings;
          setOfflineProgress({ secondsOffline, offlineEarnings });
        }
      }
      if (
        loadedData.playerClass &&
        loadedData.playerClass === loadedData.playerClass.toLowerCase()
      ) {
        loadedData.playerClass =
          loadedData.playerClass.charAt(0).toUpperCase() +
          loadedData.playerClass.slice(1);
      }
      const loadedState = { ...defaultState, ...loadedData };
      delete loadedState.pointsPerClick;
      return loadedState;
    }
    return defaultState;
  });
  const [gamePhase, setGamePhase] = useState(
    gameState.playerClass ? GAME_PHASES.CLICKING : GAME_PHASES.CLASS_SELECTION
  );
  const [gameWon, setGameWon] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState([]);
  const [isShaking, setIsShaking] = useState(false);
  const [floatingHeals, setFloatingHeals] = useState([]);
  const [isHealing, setIsHealing] = useState(false);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [activeShop, setActiveShop] = useState("upgrades");
  const [poison, setPoison] = useState({ stacks: 0, lastApplied: null });
  const [activeBuffs, setActiveBuffs] = useState({});
  const [cooldownTimers, setCooldownTimers] = useState({});
  const gemButtonRef = useRef(null);

  const currentBoss = bosses[gameState.currentBossIndex];
  const bossStage = `stage${Math.min(gameState.currentBossIndex + 1, 3)}`;
  const currentUpgrades =
    classUpgrades[bossStage]?.[gameState.playerClass] || [];
  const playerAbility = abilities.find(
    (a) => a.classId === gameState.playerClass
  );

  const playSound = (soundFile, volume = 1) => {
    if (!gameState.isMuted) {
      try {
        const audio = new Audio(soundFile);
        audio.volume = volume;
        audio.play().catch((e) => console.error("Audio play failed:", e));
      } catch (e) {
        console.error("Audio creation failed:", e);
      }
    }
  };
  const calculateAchievementBonuses = () => {
    const bonuses = {
      clickDamageMultiplier: 1,
      fameMultiplier: 1,
      clickDamageFlat: 0,
      shardMultiplier: 1,
    };
    for (const ach of achievements) {
      if (gameState.unlockedAchievements[ach.id]) {
        switch (ach.reward.type) {
          case "CLICK_DAMAGE_MULTIPLIER":
            bonuses.clickDamageMultiplier += ach.reward.value;
            break;
          case "FAME_MULTIPLIER":
            bonuses.fameMultiplier += ach.reward.value;
            break;
          case "CLICK_DAMAGE_FLAT":
            bonuses.clickDamageFlat += ach.reward.value;
            break;
          case "SHARD_MULTIPLIER":
            bonuses.shardMultiplier += ach.reward.value;
            break;
          default:
            break;
        }
      }
    }
    return bonuses;
  };

  useEffect(() => {
    const stateToSave = { ...gameState, lastSavedTimestamp: Date.now() };
    localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(stateToSave));
  }, [gameState]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const updatedTimers = {};
      if (playerAbility) {
        const cdEnd = gameState.abilityCooldowns[playerAbility.id] || 0;
        updatedTimers[playerAbility.id] = Math.max(
          0,
          Math.ceil((cdEnd - now) / 1000)
        );
      }
      setCooldownTimers(updatedTimers);
    }, 500);
    return () => clearInterval(timerInterval);
  }, [gameState.abilityCooldowns, playerAbility]);

  useEffect(() => {
    const buffId = "arcane_power";
    if (activeBuffs[buffId]) {
      const timer = setTimeout(() => {
        setActiveBuffs((prev) => {
          const newBuffs = { ...prev };
          delete newBuffs[buffId];
          return newBuffs;
        });
        toast("Arcane Power has faded.", { icon: "💨" });
      }, activeBuffs[buffId].expiresAt - Date.now());
      return () => clearTimeout(timer);
    }
  }, [activeBuffs]);

  useEffect(() => {
    for (const ach of achievements) {
      if (
        !gameState.unlockedAchievements[ach.id] &&
        ach.isUnlocked(gameState)
      ) {
        setGameState((prev) => ({
          ...prev,
          unlockedAchievements: {
            ...prev.unlockedAchievements,
            [ach.id]: true,
          },
        }));
        toast.custom((t) => (
          <div
            className={`achievement-alert ${
              t.visible ? "animate-enter" : "animate-leave"
            }`}
            onClick={() => toast(ach.rewardDescription, { icon: "🏆" })}
          >
            {" "}
            <strong>🏆 Achievement Unlocked!</strong> <p>{ach.name}</p>{" "}
            <small>Click to see reward!</small>{" "}
          </div>
        ));
      }
    }
  }, [
    gameState.totalClicks,
    gameState.totalFameEarned,
    gameState.bossesDefeated,
    gameState.hasPrestiged,
  ]);
  useEffect(() => {
    if (gameState.equippedWeapon !== "stacking_vipers") {
      if (poison.stacks > 0) setPoison({ stacks: 0, lastApplied: null });
      return;
    }
    const poisonInterval = setInterval(() => {
      if (poison.stacks > 0) {
        if (Date.now() - poison.lastApplied > 3000) {
          setPoison((p) => ({ ...p, stacks: Math.max(0, p.stacks - 1) }));
        }
        const poisonDps =
          poison.stacks * (1 + Math.floor(gameState.currentBossIndex * 1.5));
        setGameState((prev) => ({
          ...prev,
          clicksOnCurrentBoss: prev.clicksOnCurrentBoss + poisonDps,
        }));
      }
    }, 1000);
    return () => clearInterval(poisonInterval);
  }, [gameState.equippedWeapon, poison]);

  useEffect(() => {
    if (gamePhase !== GAME_PHASES.CLICKING || isHealing) return;
    const bonuses = calculateAchievementBonuses();
    let dps = gameState.pointsPerSecond;
    if (gameState.equippedWeapon === "executioners_axe") dps *= 0.5;
    if (activeBuffs["arcane_power"]) dps *= 2;
    const fameFromDps = Math.floor(dps * bonuses.fameMultiplier);
    const interval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        score: prev.score + fameFromDps,
        totalFameEarned: prev.totalFameEarned + fameFromDps,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [
    gameState.pointsPerSecond,
    gamePhase,
    isHealing,
    gameState.unlockedAchievements,
    gameState.equippedWeapon,
    activeBuffs,
  ]);

  useEffect(() => {
    if (!currentBoss || gamePhase !== GAME_PHASES.CLICKING || isHealing) return;
    if (gameState.clicksOnCurrentBoss >= currentBoss.clickThreshold) {
      setGameState((prev) => ({
        ...prev,
        bossesDefeated: {
          ...prev.bossesDefeated,
          [currentBoss.id]: (prev.bossesDefeated[currentBoss.id] || 0) + 1,
        },
      }));
      if (currentBoss.id === "oryx3") {
        setGamePhase(GAME_PHASES.EXALTED_TRANSITION);
        return;
      }
      playSound(currentBoss.breakSound);
      if (gameState.currentBossIndex === bosses.length - 1) {
        setGameWon(true);
        setGamePhase(GAME_PHASES.FINISHED);
      } else {
        setGamePhase(GAME_PHASES.TRANSITIONING);
      }
    }
  }, [
    gameState.clicksOnCurrentBoss,
    gameState.currentBossIndex,
    currentBoss,
    gamePhase,
    isHealing,
  ]);
  useEffect(() => {
    if (gamePhase === GAME_PHASES.TRANSITIONING) {
      const timer = setTimeout(() => {
        setGamePhase(GAME_PHASES.PORTAL);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase]);
  useEffect(() => {
    if (gamePhase === GAME_PHASES.EXALTED_TRANSITION) {
      const transitionTimer = setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          currentBossIndex: prev.currentBossIndex + 1,
          clicksOnCurrentBoss: 0,
          temporaryUpgradesOwned: {},
        }));
        setIsInvulnerable(true);
        const invulnerabilityTimer = setTimeout(() => {
          setIsInvulnerable(false);
          setGamePhase(GAME_PHASES.CLICKING);
        }, 2000);
        return () => clearTimeout(invulnerabilityTimer);
      }, 3000);
      return () => clearTimeout(transitionTimer);
    }
  }, [gamePhase]);
  useEffect(() => {
    if (
      !currentBoss ||
      !currentBoss.healThresholds ||
      gamePhase !== GAME_PHASES.CLICKING ||
      isHealing
    ) {
      return;
    }
    const currentHealthPercent =
      100 - (gameState.clicksOnCurrentBoss / currentBoss.clickThreshold) * 100;
    const triggeredHealsForBoss =
      gameState.triggeredHeals[currentBoss.id] || [];
    for (const heal of currentBoss.healThresholds) {
      if (
        currentHealthPercent <= heal.percent &&
        !triggeredHealsForBoss.includes(heal.percent)
      ) {
        setGameState((prev) => ({
          ...prev,
          triggeredHeals: {
            ...prev.triggeredHeals,
            [currentBoss.id]: [...triggeredHealsForBoss, heal.percent],
          },
        }));
        setIsHealing(true);
        let amountHealed = 0;
        const healPerIncrement = 2500;
        const healInterval = setInterval(() => {
          const healThisTick = Math.min(
            healPerIncrement,
            heal.amount - amountHealed
          );
          amountHealed += healThisTick;
          setGameState((prev) => ({
            ...prev,
            clicksOnCurrentBoss: Math.max(
              0,
              prev.clicksOnCurrentBoss - healThisTick
            ),
          }));
          if (gemButtonRef.current) {
            const rect = gemButtonRef.current.getBoundingClientRect();
            setFloatingHeals((current) => [
              ...current,
              {
                id: uuidv4(),
                value: healThisTick,
                x: rect.left + rect.width / 2 + (Math.random() * 80 - 40),
                y: rect.top + (Math.random() * 20 - 10),
              },
            ]);
          }
          if (amountHealed >= heal.amount) {
            clearInterval(healInterval);
            setIsHealing(false);
          }
        }, 200);
        break;
      }
    }
  }, [
    gameState.clicksOnCurrentBoss,
    currentBoss,
    gamePhase,
    isHealing,
    gameState.triggeredHeals,
  ]);

  const handleClassSelect = (className) => {
    setGameState((prev) => ({ ...prev, playerClass: className }));
    setGamePhase(GAME_PHASES.CLICKING);
  };

  const calculateDamageRange = () => {
    let minDamage = 1;
    let maxDamage = 1;
    const bonuses = calculateAchievementBonuses();
    currentUpgrades.forEach((upgrade) => {
      const owned = gameState.upgradesOwned[upgrade.id] || 0;
      if (owned > 0) {
        const bonus = Math.floor(Math.pow(owned, 0.9));
        if (upgrade.type === "perClick") {
          minDamage += (upgrade.minBonus || 0) * bonus;
          maxDamage += (upgrade.maxBonus || 0) * bonus;
        } else if (upgrade.type === "perSecond" && upgrade.clickBonus) {
          minDamage += upgrade.clickBonus * bonus;
          maxDamage += upgrade.clickBonus * bonus;
        }
      }
    });
    if (currentBoss.temporaryUpgrades) {
      currentBoss.temporaryUpgrades.forEach((tempUpgrade) => {
        const owned = gameState.temporaryUpgradesOwned[tempUpgrade.id] || 0;
        if (owned > 0) {
          const bonus = tempUpgrade.clickBonus * owned;
          minDamage += bonus;
          maxDamage += bonus;
        }
      });
    }
    switch (gameState.equippedWeapon) {
      case "executioners_axe":
        minDamage *= 0.75;
        maxDamage *= 0.75;
        break;
      case "golden_rapier":
        minDamage *= 0.8;
        maxDamage *= 0.8;
        break;
      case "stacking_vipers":
        minDamage *= 0.2;
        maxDamage *= 0.2;
        break;
      default:
        break;
    }
    minDamage += bonuses.clickDamageFlat;
    maxDamage += bonuses.clickDamageFlat;
    const prestigeDamageBonus =
      gameState.prestigeUpgradesOwned["permanentDamage"] || 0;
    const damageMultiplier = 1 + prestigeDamageBonus * 0.1;
    minDamage = minDamage * damageMultiplier * bonuses.clickDamageMultiplier;
    maxDamage = maxDamage * damageMultiplier * bonuses.clickDamageMultiplier;
    if (activeBuffs["arcane_power"]) {
      minDamage *= 2;
      maxDamage *= 2;
    }
    return {
      minDamage: Math.floor(minDamage),
      maxDamage: Math.floor(maxDamage),
    };
  };

  const handleUseAbility = (abilityId) => {
    const now = Date.now();
    const ability = abilities.find((a) => a.id === abilityId);
    if (!ability || (gameState.abilityCooldowns[abilityId] || 0) > now) {
      toast.error("Ability is on cooldown!");
      return;
    }

    switch (abilityId) {
      case "slam": {
        if (gameState.pointsPerSecond <= 0) {
          toast.error("Slam would have no effect with 0 DPS!");
          return;
        }
        const bonuses = calculateAchievementBonuses();
        let dps = gameState.pointsPerSecond;
        if (activeBuffs["arcane_power"]) dps *= 2;
        const slamDamage = Math.floor(dps * 30);
        const fameFromSlam = Math.floor(slamDamage * bonuses.fameMultiplier);
        setGameState((prev) => ({
          ...prev,
          score: prev.score + fameFromSlam,
          clicksOnCurrentBoss: prev.clicksOnCurrentBoss + slamDamage,
        }));
        setFloatingNumbers((current) => [
          ...current,
          {
            id: uuidv4(),
            value: fameFromSlam,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            className: "slam-damage",
          },
        ]);
        toast.success("SLAM!", { icon: "💥" });
        break;
      }
      case "arcane_power": {
        setActiveBuffs((prev) => ({
          ...prev,
          [ability.id]: { expiresAt: now + 10000 },
        }));
        toast("Arcane Power surges through you!", { icon: "✨" });
        break;
      }
      case "virulent_outbreak": {
        if (gameState.equippedWeapon === "stacking_vipers") {
          setPoison((p) => ({ stacks: p.stacks + 50, lastApplied: now }));
          toast("Poison surges!", { icon: "🧪" });
        } else {
          const flatDamage = 5000 * (gameState.currentBossIndex + 1);
          const fameFromAbility = Math.floor(
            flatDamage * calculateAchievementBonuses().fameMultiplier
          );
          setGameState((prev) => ({
            ...prev,
            score: prev.score + fameFromAbility,
            clicksOnCurrentBoss: prev.clicksOnCurrentBoss + flatDamage,
          }));
          toast.success("Affliction strikes!", { icon: "💀" });
        }
        break;
      }
      default:
        break;
    }
    setGameState((prev) => ({
      ...prev,
      abilityCooldowns: {
        ...prev.abilityCooldowns,
        [abilityId]: now + ability.cooldown * 1000,
      },
    }));
  };

  const calculateUpgradeCost = (upgrade) => {
    const owned = gameState.upgradesOwned[upgrade.id] || 0;
    return Math.floor(upgrade.cost * Math.pow(1.15, owned));
  };

  const handleGemClick = (event) => {
    if (
      gamePhase !== GAME_PHASES.CLICKING ||
      !currentBoss ||
      isHealing ||
      isInvulnerable
    )
      return;
    playSound(currentBoss.clickSound, 0.5);
    let { minDamage, maxDamage } = calculateDamageRange();
    let damageDealt =
      Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
    let fameEarned = damageDealt;
    const bonuses = calculateAchievementBonuses();
    switch (gameState.equippedWeapon) {
      case "executioners_axe":
        if (Math.random() < 0.1) {
          damageDealt *= 10;
          toast("CRITICAL HIT!", { icon: "💥", duration: 1000 });
        }
        break;
      case "golden_rapier":
        fameEarned *= 1.25;
        break;
      case "stacking_vipers":
        setPoison((p) => ({ stacks: p.stacks + 1, lastApplied: Date.now() }));
        break;
      default:
        break;
    }
    const isArcaneFameProc =
      activeBuffs["arcane_power"] && Math.random() < 0.25;
    if (isArcaneFameProc) {
      let dps = gameState.pointsPerSecond * 2;
      const fameFromAbility = Math.floor(dps * bonuses.fameMultiplier);
      setGameState((prev) => ({
        ...prev,
        score: prev.score + fameFromAbility,
      }));
      setFloatingNumbers((current) => [
        ...current,
        {
          id: uuidv4(),
          value: fameFromAbility,
          x: event.clientX,
          y: event.clientY,
          className: "fame-gain",
        },
      ]);
    } else {
      fameEarned = Math.floor(fameEarned * bonuses.fameMultiplier);
      const rect = event.currentTarget.getBoundingClientRect();
      setFloatingNumbers((current) => [
        ...current,
        {
          id: uuidv4(),
          value: fameEarned,
          x: rect.left + rect.width / 2 + (Math.random() * 80 - 40),
          y: rect.top + (Math.random() * 20 - 10),
        },
      ]);
      setGameState((prev) => ({
        ...prev,
        score: prev.score + fameEarned,
        clicksOnCurrentBoss: prev.clicksOnCurrentBoss + damageDealt,
        totalClicks: prev.totalClicks + 1,
        totalFameEarned: prev.totalFameEarned + fameEarned,
      }));
    }
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 150);
  };

  const handleEnterPortal = () => {
    setGameState((prev) => ({
      ...prev,
      currentBossIndex: prev.currentBossIndex + 1,
      clicksOnCurrentBoss: 0,
      temporaryUpgradesOwned: {},
      abilityCooldowns: {},
    }));
    setGamePhase(GAME_PHASES.CLICKING);
  };
  const handleBuyUpgrade = (upgrade) => {
    const currentCost = calculateUpgradeCost(upgrade);
    if (gameState.score >= currentCost) {
      setGameState((prev) => {
        const newOwned = {
          ...prev.upgradesOwned,
          [upgrade.id]: (prev.upgradesOwned[upgrade.id] || 0) + 1,
        };
        let newPps = prev.pointsPerSecond;
        if (upgrade.type === "perSecond") {
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
  const handlePrestige = () => {
    const bonuses = calculateAchievementBonuses();
    const shardsToAward = Math.floor(
      (gameState.score / 2500000) * bonuses.shardMultiplier
    );
    if (shardsToAward < 1) {
      alert(
        "You need a higher score to prestige! Try reaching at least 2,500,000 Fame."
      );
      return;
    }
    const isConfirmed = window.confirm(
      `Are you sure you want to prestige? You will earn ${shardsToAward} Exalted Shards, but your Fame, upgrades, and boss progress will reset.`
    );
    if (isConfirmed) {
      setGameState((prev) => {
        const startingFameLevel =
          prev.prestigeUpgradesOwned["permanentFame"] || 0;
        const startingPpsLevel =
          prev.prestigeUpgradesOwned["permanentPPS"] || 0;
        const startingScore = startingFameLevel * 1000;
        const startingPps = startingPpsLevel * 50;
        return {
          ...defaultState,
          playerClass: prev.playerClass,
          exaltedShards: prev.exaltedShards + shardsToAward,
          prestigeUpgradesOwned: prev.prestigeUpgradesOwned,
          score: startingScore,
          pointsPerSecond: startingPps,
          totalClicks: prev.totalClicks,
          totalFameEarned: prev.totalFameEarned,
          unlockedAchievements: prev.unlockedAchievements,
          bossesDefeated: {},
          hasPrestiged: true,
          isMuted: prev.isMuted,
          unlockedWeapons: prev.unlockedWeapons,
        };
      });
      setGameWon(false);
      setGamePhase(GAME_PHASES.CLICKING);
    }
  };
  const handleBuyPrestigeUpgrade = (upgrade) => {
    const cost = calculatePrestigeUpgradeCost(upgrade);
    if (gameState.exaltedShards >= cost) {
      setGameState((prev) => ({
        ...prev,
        exaltedShards: prev.exaltedShards - cost,
        prestigeUpgradesOwned: {
          ...prev.prestigeUpgradesOwned,
          [upgrade.id]: (prev.prestigeUpgradesOwned[upgrade.id] || 0) + 1,
        },
      }));
    } else {
      alert("Not enough Exalted Shards!");
    }
  };
  const handleBuyTemporaryUpgrade = (upgrade) => {
    const cost = Math.floor(
      upgrade.cost *
        Math.pow(1.25, gameState.temporaryUpgradesOwned[upgrade.id] || 0)
    );
    if (gameState.score >= cost) {
      setGameState((prev) => ({
        ...prev,
        score: prev.score - cost,
        temporaryUpgradesOwned: {
          ...prev.temporaryUpgradesOwned,
          [upgrade.id]: (prev.temporaryUpgradesOwned[upgrade.id] || 0) + 1,
        },
      }));
    } else {
      alert("Not enough Fame for that boost!");
    }
  };
  const handleUnlockWeapon = (weapon) => {
    if (gameState.exaltedShards >= weapon.cost) {
      setGameState((prev) => ({
        ...prev,
        exaltedShards: prev.exaltedShards - weapon.cost,
        unlockedWeapons: { ...prev.unlockedWeapons, [weapon.id]: true },
      }));
      toast.success(`Unlocked ${weapon.name}!`);
    } else {
      alert("Not enough Exalted Shards!");
    }
  };
  const handleEquipWeapon = (weaponId) => {
    setGameState((prev) => ({ ...prev, equippedWeapon: weaponId }));
    toast.success(
      `Equipped ${
        weapons.find((w) => w.id === weaponId)?.name || "Default Sword"
      }!`
    );
  };
  const calculatePrestigeUpgradeCost = (upgrade) => {
    const owned = gameState.prestigeUpgradesOwned[upgrade.id] || 0;
    return Math.floor(upgrade.cost * Math.pow(1.5, owned));
  };
  const getCurrentImage = () => {
    if (!currentBoss) return "";
    if (gameWon) {
      const finalBoss = bosses[bosses.length - 1];
      return finalBoss.images[finalBoss.images.length - 1];
    }
    const stageCount = currentBoss.images.length;
    const progress = Math.min(
      gameState.clicksOnCurrentBoss / currentBoss.clickThreshold,
      1
    );
    const imageIndex = Math.min(
      Math.floor(progress * stageCount),
      stageCount - 1
    );
    return currentBoss.images[imageIndex];
  };
  const getHealthPercent = () => {
    if (!currentBoss || gameWon) return gameWon ? 0 : 100;
    const percent =
      (gameState.clicksOnCurrentBoss / currentBoss.clickThreshold) * 100;
    return 100 - percent;
  };
  const handleResetSave = () => {
    const isConfirmed = window.confirm(
      "Are you sure you want to reset all your progress? This action cannot be undone."
    );
    if (isConfirmed) {
      localStorage.removeItem(SAVE_GAME_KEY);
      setGameState(defaultState);
      setGameWon(false);
      setGamePhase(GAME_PHASES.CLASS_SELECTION);
    }
  };
  const toggleMute = () => {
    setGameState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  if (gamePhase === GAME_PHASES.CLASS_SELECTION) {
    return (
      <div className="card">
        {" "}
        <div className="clicker-container">
          {" "}
          <h3>Choose Your Class, Cutie!</h3>{" "}
          <div
            className="class-selection-container"
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              marginTop: "1rem",
            }}
          >
            {" "}
            {classes.map((pClass) => (
              <button
                key={pClass.id}
                className="btn-class-select"
                onClick={() => handleClassSelect(pClass.id)}
              >
                {" "}
                <img src={pClass.image} alt={pClass.name} />{" "}
                <span>{pClass.name}</span>{" "}
              </button>
            ))}{" "}
          </div>{" "}
        </div>{" "}
      </div>
    );
  }
  if (!currentBoss) {
    return (
      <div className="card">
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="game-hud">
        {" "}
        <button onClick={toggleMute} className="btn-mute">
          {" "}
          {gameState.isMuted ? "🔇" : "🔊"}{" "}
        </button>{" "}
      </div>
      {offlineProgress && (
        <div className="modal-backdrop">
          {" "}
          <div className="modal-content">
            {" "}
            <h2>Welcome Back!</h2>{" "}
            <p>
              You were away for{" "}
              <strong>{formatTime(offlineProgress.secondsOffline)}</strong>.
            </p>{" "}
            <p>While you were gone, you earned</p>{" "}
            <p className="modal-earnings">
              {Math.floor(offlineProgress.offlineEarnings).toLocaleString()}{" "}
              Fame!
            </p>{" "}
            <p className="modal-efficiency">
              ({Math.round(OFFLINE_EFFICIENCY_RATE * 100)}% efficiency)
            </p>{" "}
            <button onClick={() => setOfflineProgress(null)}>Awesome!</button>{" "}
          </div>{" "}
        </div>
      )}
      <div className="card">
        {floatingNumbers.map((num) => (
          <span
            key={num.id}
            className={`floating-number ${num.className || ""}`}
            style={{ left: num.x, top: num.y }}
            onAnimationEnd={() =>
              setFloatingNumbers((current) =>
                current.filter((n) => n.id !== num.id)
              )
            }
          >
            {" "}
            {num.className === "fame-gain" ? "+" : "-"}
            {num.value.toLocaleString()}{" "}
          </span>
        ))}
        {floatingHeals.map((num) => (
          <span
            key={num.id}
            className="floating-number heal"
            style={{ left: num.x, top: num.y }}
            onAnimationEnd={() =>
              setFloatingHeals((current) =>
                current.filter((n) => n.id !== num.id)
              )
            }
          >
            {" "}
            +{num.value.toLocaleString()}{" "}
          </span>
        ))}
        <div className="clicker-container">
          <h2>{Math.floor(gameState.score).toLocaleString()} Fame </h2>
          <p style={{ color: "#8a2be2", fontWeight: "bold" }}>
            {gameState.exaltedShards} Exalted Shards
          </p>
          {gamePhase === GAME_PHASES.CLICKING && (
            <p>
              {" "}
              {gameState.pointsPerSecond.toLocaleString()} DPS /{" "}
              {calculateDamageRange().minDamage.toLocaleString()}-
              {calculateDamageRange().maxDamage.toLocaleString()} per click{" "}
            </p>
          )}
          <h3 style={{ textAlign: "center" }}>
            {" "}
            {gameWon ? "You Did It!" : currentBoss.name}{" "}
            {isHealing && (
              <span className="healing-indicator"> HEALING...</span>
            )}{" "}
            {isInvulnerable && (
              <span className="invulnerable-indicator"> INVULNERABLE</span>
            )}{" "}
          </h3>
          <div
            className={`gem-button ${
              isHealing ||
              isInvulnerable ||
              gamePhase === GAME_PHASES.EXALTED_TRANSITION
                ? "disabled"
                : ""
            }`}
            ref={gemButtonRef}
            onClick={handleGemClick}
          >
            {" "}
            <img
              src={getCurrentImage()}
              alt={currentBoss.name}
              className={` ${
                gamePhase === GAME_PHASES.TRANSITIONING ? "fading-out" : ""
              } ${
                gamePhase === GAME_PHASES.EXALTED_TRANSITION ? "fading-out" : ""
              } ${isShaking ? "shake" : ""} `}
            />{" "}
          </div>
          {(gamePhase === GAME_PHASES.CLICKING ||
            gamePhase === GAME_PHASES.TRANSITIONING ||
            gamePhase === GAME_PHASES.EXALTED_TRANSITION) && (
            <div className="health-bar-container">
              {" "}
              <div
                className="health-bar-inner"
                style={{ width: `${getHealthPercent()}%` }}
              ></div>{" "}
              <span className="health-bar-text">
                {Math.max(
                  0,
                  Math.floor(
                    currentBoss.clickThreshold - gameState.clicksOnCurrentBoss
                  )
                ).toLocaleString()}{" "}
                / {currentBoss.clickThreshold.toLocaleString()}
              </span>{" "}
            </div>
          )}
          {gameWon && (
            <div className="portal-prompt">
              {" "}
              <h4>Congratulations, cutie! You beat the game! 💖</h4>{" "}
              <button onClick={handlePrestige}>Prestige for Bonuses!~</button>{" "}
            </div>
          )}

          <div className="ability-bar">
            {playerAbility && (
              <button
                className="ability-button"
                onClick={() => handleUseAbility(playerAbility.id)}
                disabled={cooldownTimers[playerAbility.id] > 0}
              >
                <div className="ability-info">
                  <strong>{playerAbility.name}</strong>
                  <small>{playerAbility.description}</small>
                </div>
                {cooldownTimers[playerAbility.id] > 0 && (
                  <div className="cooldown-overlay">
                    <div className="cooldown-text">
                      {cooldownTimers[playerAbility.id]}s
                    </div>
                  </div>
                )}
              </button>
            )}
          </div>

          {gamePhase === GAME_PHASES.PORTAL && (
            <div className="portal-prompt">
              {" "}
              <img
                src={currentBoss.portalImage}
                alt="A mysterious portal"
                className="portal-image"
              />{" "}
              <h4>A portal has opened! Do you enter?</h4>{" "}
              <button onClick={handleEnterPortal}>Enter!~</button>{" "}
            </div>
          )}
          {(gamePhase === GAME_PHASES.CLICKING || isInvulnerable) && (
            <>
              <div className="shop-toggle">
                {" "}
                <button
                  className={`btn-toggle ${
                    activeShop === "upgrades" ? "active" : ""
                  }`}
                  onClick={() => setActiveShop("upgrades")}
                >
                  {" "}
                  Upgrades{" "}
                </button>{" "}
                <button
                  className={`btn-toggle ${
                    activeShop === "prestige" ? "active" : ""
                  }`}
                  onClick={() => setActiveShop("prestige")}
                >
                  {" "}
                  Prestige{" "}
                </button>{" "}
                <button
                  className={`btn-toggle ${
                    activeShop === "achievements" ? "active" : ""
                  }`}
                  onClick={() => setActiveShop("achievements")}
                >
                  {" "}
                  Achievements{" "}
                </button>{" "}
                <button
                  className={`btn-toggle ${
                    activeShop === "armory" ? "active" : ""
                  }`}
                  onClick={() => setActiveShop("armory")}
                >
                  {" "}
                  Armory{" "}
                </button>{" "}
              </div>
              {activeShop === "upgrades" && (
                <>
                  {" "}
                  {currentBoss.temporaryUpgrades && (
                    <div className="upgrades-shop temporary-shop">
                      {" "}
                      <h4>Temporary Boosts</h4>{" "}
                      <div className="upgrades-grid">
                        {" "}
                        {currentBoss.temporaryUpgrades.map((up) => {
                          const owned =
                            gameState.temporaryUpgradesOwned[up.id] || 0;
                          const cost = Math.floor(
                            up.cost * Math.pow(1.25, owned)
                          );
                          return (
                            <button
                              key={up.id}
                              onClick={() => handleBuyTemporaryUpgrade(up)}
                              className="btn-upgrade temporary"
                              disabled={gameState.score < cost || isHealing}
                            >
                              {" "}
                              <span className="upgrade-name">
                                {up.name}
                              </span>{" "}
                              <small>
                                +{up.clickBonus.toLocaleString()} Click Damage
                              </small>{" "}
                              <small>Cost: {cost.toLocaleString()}</small>{" "}
                              <small>(Owned: {owned})</small>{" "}
                            </button>
                          );
                        })}{" "}
                      </div>{" "}
                    </div>
                  )}{" "}
                  <div className="upgrades-shop">
                    {" "}
                    <h4>{gameState.playerClass}'s Upgrades!~</h4>{" "}
                    <div className="upgrades-grid">
                      {" "}
                      {currentUpgrades.map((up) => {
                        const cost = calculateUpgradeCost(up);
                        return (
                          <button
                            key={up.id}
                            onClick={() => handleBuyUpgrade(up)}
                            className="btn-upgrade"
                            disabled={gameState.score < cost || isHealing}
                          >
                            {" "}
                            <img
                              src={up.image}
                              alt={up.name}
                              className="upgrade-image"
                            />{" "}
                            <span className="upgrade-name">{up.name}</span>{" "}
                            <small>Cost: {cost.toLocaleString()}</small>{" "}
                            <small>
                              (Owned: {gameState.upgradesOwned[up.id] || 0})
                            </small>{" "}
                          </button>
                        );
                      })}{" "}
                    </div>{" "}
                  </div>{" "}
                </>
              )}
              {activeShop === "prestige" && (
                <div className="upgrades-shop">
                  {" "}
                  <h4 style={{ color: "#8a2be2" }}>Prestige Shop</h4>{" "}
                  <div className="upgrades-grid">
                    {" "}
                    {prestigeUpgrades.map((up) => {
                      const cost = calculatePrestigeUpgradeCost(up);
                      return (
                        <button
                          key={up.id}
                          onClick={() => handleBuyPrestigeUpgrade(up)}
                          className="btn-upgrade prestige"
                          disabled={gameState.exaltedShards < cost || isHealing}
                        >
                          {" "}
                          <span className="upgrade-name">{up.name}</span>{" "}
                          <small>{up.description}</small>{" "}
                          <small>Cost: {cost} Shards</small>{" "}
                          <small>
                            (Level:{" "}
                            {gameState.prestigeUpgradesOwned[up.id] || 0})
                          </small>{" "}
                        </button>
                      );
                    })}{" "}
                    {weapons.map(
                      (w) =>
                        !gameState.unlockedWeapons[w.id] && (
                          <button
                            key={w.id}
                            onClick={() => handleUnlockWeapon(w)}
                            className="btn-upgrade weapon-unlock"
                            disabled={
                              gameState.exaltedShards < w.cost || isHealing
                            }
                          >
                            <span className="upgrade-name">
                              Unlock: {w.name}
                            </span>
                            <small>{w.description}</small>
                            <small>Cost: {w.cost} Shards</small>
                          </button>
                        )
                    )}{" "}
                  </div>{" "}
                </div>
              )}
              {activeShop === "achievements" && (
                <div className="upgrades-shop">
                  {" "}
                  <h4>Achievements</h4>{" "}
                  <div className="achievements-grid">
                    {" "}
                    {achievements.map((ach) => (
                      <div
                        key={ach.id}
                        className={`achievement-item ${
                          gameState.unlockedAchievements[ach.id]
                            ? "unlocked"
                            : ""
                        }`}
                      >
                        {" "}
                        <strong className="achievement-name">
                          {ach.name}
                        </strong>{" "}
                        <p className="achievement-desc">{ach.description}</p>{" "}
                        <p className="achievement-reward">
                          {gameState.unlockedAchievements[ach.id]
                            ? ach.rewardDescription
                            : "???"}
                        </p>{" "}
                      </div>
                    ))}{" "}
                  </div>{" "}
                </div>
              )}
              {activeShop === "armory" && (
                <div className="upgrades-shop">
                  {" "}
                  <h4>Armory</h4>{" "}
                  <div className="armory-grid">
                    {" "}
                    <div
                      key="default"
                      className={`weapon-item ${
                        gameState.equippedWeapon === "default" ? "equipped" : ""
                      }`}
                      onClick={() => handleEquipWeapon("default")}
                    >
                      {" "}
                      <strong>Default Sword</strong>{" "}
                      <p>Your trusty, reliable blade. No special effects.</p>{" "}
                    </div>{" "}
                    {weapons.map(
                      (w) =>
                        gameState.unlockedWeapons[w.id] && (
                          <div
                            key={w.id}
                            className={`weapon-item ${
                              gameState.equippedWeapon === w.id
                                ? "equipped"
                                : ""
                            }`}
                            onClick={() => handleEquipWeapon(w.id)}
                          >
                            {" "}
                            <strong>{w.name}</strong> <p>{w.description}</p>{" "}
                            <div className="weapon-pro-con">
                              {" "}
                              {w.pro_con.map((eff, index) => (
                                <small key={index} className={eff.type}>
                                  {eff.text}
                                </small>
                              ))}{" "}
                            </div>{" "}
                          </div>
                        )
                    )}{" "}
                  </div>{" "}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: "1rem",
          paddingBottom: "1rem",
        }}
      >
        {" "}
        <button className="btn-reset" onClick={handleResetSave}>
          {" "}
          Reset Save Data{" "}
        </button>{" "}
      </div>
    </>
  );
}

export default PixelClickerGame;
