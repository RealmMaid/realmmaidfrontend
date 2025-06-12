import React, { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useGameStore } from "../../stores/gameStore";
import toast, { Toaster } from "react-hot-toast";

// Data imports - these would be used by the components below
import { classes } from "../../data/classes";
import { abilities } from "../../data/abilities";
import { weapons } from "../../data/weapons";
import { bosses } from "../../data/bosses";
import { classUpgrades } from "../../data/classUpgrades";
import { prestigeUpgrades } from "../../data/prestigeUpgrades";
import { achievements } from "../../data/achievements";

// In a larger project, each of these components would be in its own file
// inside `src/components/dashboard/clicker/`

function Hud() {
  const { score, exaltedShards, isMuted, toggleMute, resetSave } = useGameStore(
    (state) => ({
      score: state.score,
      exaltedShards: state.exaltedShards,
      isMuted: state.isMuted,
      toggleMute: state.toggleMute,
      resetSave: state.resetSave,
    })
  );

  return (
    <>
      <div className="game-hud">
        <button onClick={toggleMute} className="btn-mute">
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>
      <div className="stats-display">
        <h2>{Math.floor(score).toLocaleString()} Fame</h2>
        <p style={{ color: "#8a2be2", fontWeight: "bold" }}>
          {exaltedShards} Exalted Shards
        </p>
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: "1rem",
          paddingBottom: "1rem",
        }}
      >
        <button className="btn-reset" onClick={resetSave}>
          {" "}
          Reset Save Data{" "}
        </button>
      </div>
    </>
  );
}

function BossDisplay() {
  const [floatingNumbers, setFloatingNumbers] = useState([]);
  const [isShaking, setIsShaking] = useState(false);
  const gemButtonRef = useRef(null);

  const {
    gamePhase,
    currentBossIndex,
    clicksOnCurrentBoss,
    isHealing,
    isInvulnerable,
    equippedWeapon,
    activeBuffs,
    pointsPerSecond,
    playSound,
    applyClick,
    setPoison,
  } = useGameStore();

  const currentBoss = bosses[currentBossIndex];

  const handleGemClick = (event) => {
    if (gamePhase !== "clicking" || isHealing || isInvulnerable) return;
    playSound(currentBoss.clickSound, 0.5);

    const { calculateDamageRange, calculateAchievementBonuses } =
      useGameStore.getState();
    let { minDamage, maxDamage } = calculateDamageRange();
    let damageDealt =
      Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
    let fameEarned = damageDealt;
    const bonuses = calculateAchievementBonuses();

    switch (equippedWeapon) {
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
      let dps = pointsPerSecond * (activeBuffs["arcane_power"] ? 2 : 1);
      const fameFromAbility = Math.floor(dps * bonuses.fameMultiplier);
      applyClick(0, fameFromAbility);
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
      applyClick(damageDealt, fameEarned);
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
    }
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 150);
  };

  const getCurrentImage = () => {
    /* ... same as before ... */ return currentBoss.images[0];
  };
  const getHealthPercent = () => {
    /* ... same as before ... */ return (
      100 - (clicksOnCurrentBoss / currentBoss.clickThreshold) * 100
    );
  };

  return (
    <>
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
      <h3 style={{ textAlign: "center" }}>
        {" "}
        {currentBoss.name} {isHealing && <span> HEALING...</span>}{" "}
        {isInvulnerable && <span> INVULNERABLE</span>}{" "}
      </h3>
      <div
        className={`gem-button ${
          isHealing || isInvulnerable ? "disabled" : ""
        }`}
        ref={gemButtonRef}
        onClick={handleGemClick}
      >
        <img
          src={getCurrentImage()}
          alt={currentBoss.name}
          className={`${isShaking ? "shake" : ""}`}
        />
      </div>
      <div className="health-bar-container">
        <div
          className="health-bar-inner"
          style={{ width: `${getHealthPercent()}%` }}
        ></div>
        <span className="health-bar-text">
          {Math.max(
            0,
            Math.floor(currentBoss.clickThreshold - clicksOnCurrentBoss)
          ).toLocaleString()}{" "}
          / {currentBoss.clickThreshold.toLocaleString()}
        </span>
      </div>
    </>
  );
}

// ... more small components for Shops, Armory, etc.

// The main container that runs the game
function GameContainer() {
  // This is where all the game loops and recurring checks will live
  useEffect(() => {
    // Here you would put the setInterval for DPS, poison, achievement checks, etc.
    // This keeps the logic tied to the component lifecycle.
  }, []);

  return (
    <div className="card">
      <div className="clicker-container">
        <Hud />
        <BossDisplay />
        {/* We would render other components like AbilityBar and ShopArea here */}
      </div>
    </div>
  );
}

function ClassSelection() {
  const handleClassSelect = useGameStore((state) => state.handleClassSelect);
  return (
    <div className="card">
      <div className="clicker-container">
        <h3>Choose Your Class, Cutie!</h3>
        <div className="class-selection-container">
          {classes.map((pClass) => (
            <button
              key={pClass.id}
              className="btn-class-select"
              onClick={() => handleClassSelect(pClass.id)}
            >
              <img src={pClass.image} alt={pClass.name} />
              <span>{pClass.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// This is the final, exported component that your App.jsx imports
function PixelClickerGame() {
  const playerClass = useGameStore((state) => state.playerClass);

  return (
    <>
      <Toaster position="top-right" />
      {/* We could render the WelcomeBackModal here */}

      {playerClass ? <GameContainer /> : <ClassSelection />}
    </>
  );
}

export default PixelClickerGame;
