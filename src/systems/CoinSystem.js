const TOTAL_COINS_KEY = 'flappy3d.totalCoins';

/**
 * Tracks coins as a currency completely separate from ScoreSystem -
 * collecting a coin never touches score/best, and scoring a point
 * never touches coins. That separation is deliberate: coins are meant
 * to eventually be spent on cosmetics, so they need their own wallet
 * instead of being folded into the score number.
 *
 * `run` is this attempt's coin count (resets every run, mirroring
 * ScoreSystem.score). `total` is the persisted lifetime wallet
 * (mirroring ScoreSystem.best), except nothing spends from it yet -
 * that's future cosmetics-shop work, not this pass.
 *
 * Emits 'coins' with the current `run` count on every change, so the
 * HUD can just listen rather than poll.
 */
export class CoinSystem {
  constructor(emitter) {
    this.emitter = emitter;
    this.run = 0;
    this.total = this._loadTotal();
  }

  reset() {
    this.run = 0;
    this.emitter.emit('coins', this.run);
  }

  addCoin(amount = 1) {
    this.run += amount;
    this.total += amount;
    this._saveTotal(this.total);
    this.emitter.emit('coins', this.run);
    this.emitter.emit('walletChanged', this.total);
  }

  /** Spends from the lifetime wallet (e.g. a shop purchase). Returns false and spends nothing if the wallet can't cover it. */
  spend(amount) {
    if (amount > this.total) return false;
    this.total -= amount;
    this._saveTotal(this.total);
    this.emitter.emit('walletChanged', this.total);
    return true;
  }

  _loadTotal() {
    try {
      return Number(localStorage.getItem(TOTAL_COINS_KEY)) || 0;
    } catch {
      return 0; // localStorage unavailable (e.g. privacy mode) - just don't persist
    }
  }

  _saveTotal(value) {
    try {
      localStorage.setItem(TOTAL_COINS_KEY, String(value));
    } catch {
      // ignore - wallet just won't persist this session
    }
  }
}