const UNLOCKED_KEY = 'flappy3d.unlockedSkins';
const EQUIPPED_KEY = 'flappy3d.equippedSkin';

/**
 * Placeholder cosmetic catalog. Each "skin" is just a flat body color
 * for now - swap `color` for a real texture/model reference later
 * without touching ShopSystem's public shape (getSkins/purchase/equip).
 * 'classic' is the bird's original color and is always unlocked/free,
 * so there's never a state where nothing is equipped.
 */
const SKINS = [
  { id: 'classic', name: 'Classic', cost: 0, color: 0xf4d35e },
  { id: 'crimson', name: 'Crimson', cost: 20, color: 0xe74c3c },
  { id: 'azure', name: 'Azure', cost: 20, color: 0x3498db },
  { id: 'emerald', name: 'Emerald', cost: 30, color: 0x2ecc71 },
  { id: 'obsidian', name: 'Obsidian', cost: 50, color: 0x2c2c2c },
  { id: 'gold', name: 'Gold', cost: 80, color: 0xffd700 },
];

/**
 * Owns the cosmetics catalog plus which skins are unlocked/equipped,
 * persisted in localStorage. Spends from CoinSystem's lifetime wallet
 * (never the per-run count) so purchases survive across runs same as
 * the coins that paid for them.
 */
export class ShopSystem {
  constructor(coinSystem, emitter) {
    this.coinSystem = coinSystem;
    this.emitter = emitter;
    this.unlocked = this._loadUnlocked();
    this.equipped = this._loadEquipped();
  }

  /** Returns the full catalog, each entry annotated with this player's unlocked/equipped state. */
  getSkins() {
    return SKINS.map((skin) => ({
      ...skin,
      unlocked: this.unlocked.has(skin.id),
      equipped: this.equipped === skin.id,
    }));
  }

  getEquippedColor() {
    const skin = SKINS.find((s) => s.id === this.equipped) ?? SKINS[0];
    return skin.color;
  }

  canAfford(skin) {
    return this.coinSystem.total >= skin.cost;
  }

  /** Unlocks a skin by spending from the wallet. Returns false (spending nothing) if already owned or unaffordable. */
  purchase(id) {
    const skin = SKINS.find((s) => s.id === id);
    if (!skin || this.unlocked.has(id)) return false;
    if (!this.coinSystem.spend(skin.cost)) return false;

    this.unlocked.add(id);
    this._saveUnlocked();
    this.emitter.emit('shopChanged');
    return true;
  }

  /** Equips an already-unlocked skin. Returns false if it isn't owned yet. */
  equip(id) {
    if (!this.unlocked.has(id)) return false;

    this.equipped = id;
    this._saveEquipped();
    this.emitter.emit('shopChanged');
    this.emitter.emit('skinEquipped', this.getEquippedColor());
    return true;
  }

  _loadUnlocked() {
    try {
      const raw = localStorage.getItem(UNLOCKED_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      return new Set(['classic', ...ids]); // classic is always unlocked
    } catch {
      return new Set(['classic']);
    }
  }

  _saveUnlocked() {
    try {
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify([...this.unlocked]));
    } catch {
      // ignore - unlocks just won't persist this session
    }
  }

  _loadEquipped() {
    try {
      return localStorage.getItem(EQUIPPED_KEY) || 'classic';
    } catch {
      return 'classic';
    }
  }

  _saveEquipped() {
    try {
      localStorage.setItem(EQUIPPED_KEY, this.equipped);
    } catch {
      // ignore - equipped choice just won't persist this session
    }
  }
}