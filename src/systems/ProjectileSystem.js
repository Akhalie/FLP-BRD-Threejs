import { Fireball } from '../entities/Fireball.js';
import { FireBreath } from '../entities/FireBreath.js';
import { TailSwipe } from '../entities/TailSwipe.js';
import { ObjectPool } from './ObjectPool.js';
import { CONFIG } from '../utils/Constants.js';

/**
 * Owns every projectile/hazard-entity in the game (docs/phase5-encounters.md's
 * "Projectile System" section). Phase 5.3 only had Fireballs; Phase
 * 5.4 adds Fire Breath walls and Tail Swipe bars as sibling
 * pools/spawn methods here, without changing how encounters talk to
 * this class. (Dive is the one Phase 5.4 attack NOT here - it's the
 * dragon's own body, owned directly by AttackController.)
 *
 * Same object-pooling discipline as PipeSpawner/CoinSystem - nothing
 * here allocates a new THREE object mid-fight, only acquires/releases
 * from a pre-warmed pool.
 *
 * One instance is owned per-encounter (constructed in DragonEncounter's
 * `_onStart`, thrown away in `_onCleanup`) rather than shared globally
 * - simplest way to guarantee no stray hazard ever survives into
 * normal pipe gameplay after a fight ends.
 */
export class ProjectileSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeFireballs = [];
    this.activeFireBreaths = [];
    this.activeTailSwipes = [];

    this.fireballPool = new ObjectPool(
      () => new Fireball(),
      (fireball) => {
        fireball.active = false;
        this.scene.remove(fireball.group);
      },
      8 // pre-warm enough that a burst of shots never allocates mid-fight
    );

    // AttackController only ever runs one pattern at a time
    // (docs/phase5-encounters.md's "Attack System" section), so in
    // practice at most one of these is ever in flight - pooled at 2
    // anyway so a slow-to-despawn one never blocks the next cast.
    this.fireBreathPool = new ObjectPool(
      () => new FireBreath(),
      (wall) => {
        wall.active = false;
        this.scene.remove(wall.group);
      },
      2
    );

    this.tailSwipePool = new ObjectPool(
      () => new TailSwipe(),
      (swipe) => {
        swipe.active = false;
        this.scene.remove(swipe.group);
      },
      2
    );
  }

  /** Launches a fireball from (x, y) with the given velocity (world units/sec). */
  spawnFireball(x, y, vx, vy) {
    const fireball = this.fireballPool.acquire();
    fireball.spawn(x, y, vx, vy);
    this.scene.add(fireball.group);
    this.activeFireballs.push(fireball);
    return fireball;
  }

  /** Launches a Fire Breath wall from `x` with its gap centered on `gapCenterY` (Phase 5.4 - see FireBreath.js). */
  spawnFireBreath(x, gapCenterY) {
    const wall = this.fireBreathPool.acquire();
    wall.spawn(x, gapCenterY);
    this.scene.add(wall.group);
    this.activeFireBreaths.push(wall);
    return wall;
  }

  /** Launches a Tail Swipe bar from `x`, starting centered on `startY` (Phase 5.4 - see TailSwipe.js). */
  spawnTailSwipe(x, startY) {
    const swipe = this.tailSwipePool.acquire();
    swipe.spawn(x, startY);
    this.scene.add(swipe.group);
    this.activeTailSwipes.push(swipe);
    return swipe;
  }

  /** Call once per frame while any hazards should be moving (DragonEncounter's ACTIVE phase). */
  update(delta) {
    this._updateList(this.activeFireballs, this.fireballPool, delta, (f) => this._isOffScreenPoint(f.getPosition()));
    this._updateList(this.activeFireBreaths, this.fireBreathPool, delta, (w) => this._isOffScreenX(w.getX()));
    this._updateList(this.activeTailSwipes, this.tailSwipePool, delta, (s) => this._isOffScreenX(s.getX()));
  }

  /**
   * Returns true and immediately despawns whichever hazard `targetBox`
   * (the bird's hitbox) overlaps first - same pure, one-hit-per-call
   * contract as CollisionSystem.checkPipes/checkCoins.
   */
  checkHit(targetBox) {
    if (this._checkListHit(this.activeFireballs, this.fireballPool, (f) => f.box.intersectsBox(targetBox))) {
      return true;
    }
    if (this._checkWallHit(targetBox)) return true;
    if (this._checkListHit(this.activeTailSwipes, this.tailSwipePool, (s) => s.box.intersectsBox(targetBox))) {
      return true;
    }
    return false;
  }

  /** Clears every in-flight hazard immediately. Called on victory (Phase 5.2's outro shouldn't be able to kill you) and on encounter cleanup. */
  reset() {
    for (const fireball of this.activeFireballs) this.fireballPool.release(fireball);
    this.activeFireballs = [];
    for (const wall of this.activeFireBreaths) this.fireBreathPool.release(wall);
    this.activeFireBreaths = [];
    for (const swipe of this.activeTailSwipes) this.tailSwipePool.release(swipe);
    this.activeTailSwipes = [];
  }

  _updateList(list, pool, delta, isDone) {
    for (let i = list.length - 1; i >= 0; i--) {
      const item = list[i];
      item.update(delta);
      if (isDone(item)) {
        list.splice(i, 1);
        pool.release(item);
      }
    }
  }

  _checkListHit(list, pool, predicate) {
    for (let i = 0; i < list.length; i++) {
      if (predicate(list[i])) {
        const [item] = list.splice(i, 1);
        pool.release(item);
        return true;
      }
    }
    return false;
  }

  /** Fire Breath walls carry two boxes (top/bottom chunk) instead of one, so they need their own hit-test rather than fitting `_checkListHit`'s single-predicate shape. */
  _checkWallHit(targetBox) {
    for (let i = 0; i < this.activeFireBreaths.length; i++) {
      const wall = this.activeFireBreaths[i];
      if (wall.topBox.intersectsBox(targetBox) || wall.bottomBox.intersectsBox(targetBox)) {
        this.activeFireBreaths.splice(i, 1);
        this.fireBreathPool.release(wall);
        return true;
      }
    }
    return false;
  }

  _isOffScreenPoint({ x, y }) {
    const pad = CONFIG.projectileDespawnPadding;
    return (
      x < CONFIG.pipeDespawnX - pad ||
      x > CONFIG.dragonOffScreenX + pad ||
      y < CONFIG.groundY - pad ||
      y > CONFIG.ceilingY + pad
    );
  }

  /** Fire Breath/Tail Swipe hazards span most of the vertical play area by design, so only x needs checking (unlike a fireball's point despawn check). */
  _isOffScreenX(x) {
    const pad = CONFIG.projectileDespawnPadding;
    return x < CONFIG.pipeDespawnX - pad || x > CONFIG.dragonOffScreenX + pad;
  }
}
