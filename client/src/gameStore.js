import { create } from 'zustand';
import { achievements } from './data/achievements';
import { weapons } from './data/weapons';
// ... import other data files

const defaultState = { /* ... your entire defaultState object ... */ };

export const useGameStore = create((set, get) => ({
  // === STATE PROPERTIES ===
  ...defaultState,

  // === ACTIONS (Functions that modify state) ===

  // Example: handleBuyUpgrade
  handleBuyUpgrade: (upgrade) => {
    const { score, upgradesOwned, pointsPerSecond } = get();
    const owned = upgradesOwned[upgrade.id] || 0;
    const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));

    if (score >= cost) {
      set((state) => ({
        score: state.score - cost,
        pointsPerSecond: upgrade.type === 'perSecond' ? state.pointsPerSecond + upgrade.value : state.pointsPerSecond,
        upgradesOwned: {
          ...state.upgradesOwned,
          [upgrade.id]: (state.upgradesOwned[upgrade.id] || 0) + 1,
        },
      }));
    } else {
      alert("Oopsie! Not enough points, cutie!");
    }
  },

  // Example: handleEquipWeapon
  handleEquipWeapon: (weaponId) => {
    const weapon = weapons.find(w => w.id === weaponId);
    set({ equippedWeapon: weaponId });
    // You can even call toast from here if you import it
    // toast.success(`Equipped ${weapon?.name || 'Default Sword'}!`);
  },
  
  // ... We would move ALL your other handler functions here ...
  // handlePrestige, handleUseAbility, toggleMute, etc.
}));
