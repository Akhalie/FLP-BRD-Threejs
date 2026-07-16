import { Fireball } from '../entities/Fireball.js';
import { ObjectPool } from './ObjectPool.js';
import { CONFIG } from '../utils/Constants.js';

/**
 * Owns every projectile in the game (docs/phase5-encounters.md's
 * "Projectile System" section). Phase 5.3 only has Fireballs; future
 * attacks (lasers, meteors) get their own sibling pool/spawn method
 * here without changing how encounters talk to this class.
 *
 * Same object-pooling discipline as PipeSpawner/CoinSystem - nothing
 * here allocates a new THREE object mid-fight, only acquires/releases
 * from a pre-warmed pool.
 *
 * One instance is owned per-encounter (constructed in DragonEncounter's
 * `_onStart`, thrown away in `_onCleanup`) rather than shared globally
 * - simplest way to guarantee no stray fireball ever survives into
 * normal pipe gameplay after a fight ends.
 */
export class ProjectileSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeFireballs = [];

    this.fireballPool = new ObjectPool(
      () => new Fireball(),
      (fireball) => {
        fireball.active = false;
        this.scene.remove(fireball.group);
      },
      8 // pre-warm enough that a burst of shots never allocates mid-fight
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

  /** Call once per frame while any projectiles should be moving (DragonEncounter's ACTIVE phase). */
  update(delta) {
    for (let i = this.activeFireballs.length - 1; i >= 0; i--) {
      const fireball = this.activeFireballs[i];
      fireball.update(delta);

      if (this._isOffScreen(fireball)) {
        this.activeFireballs.splice(i, 1);
        this.fireballPool.release(fireball);
      }
    }
  }

  /**
   * Returns true and immediately despawns the fireball if `targetBox`
   * (the bird's hitbox) overlaps any active one - same pure,
   * one-hit-per-call contract as CollisionSystem.checkPipes/checkCoins.
   */
  checkHit(targetBox) {
    for (let i = 0; i < this.activeFireballs.length; i++) {
      const fireball = this.activeFireballs[i];
      if (fireball.box.intersectsBox(targetBox)) {
        this.activeFireballs.splice(i, 1);
        this.fireballPool.release(fireball);
        return true;
      }
    }
    return false;
  }

  /** Clears every in-flight projectile immediately. Called on victory (Phase 5.2's outro shouldn't be able to kill you) and on encounter cleanup. */
  reset() {
    for (const fireball of this.activeFireballs) {
      this.fireballPool.release(fireball);
    }
    this.activeFireballs = [];
  }

  _isOffScreen(fireball) {
    const { x, y } = fireball.getPosition();
    const pad = CONFIG.projectileDespawnPadding;
    return (
      x < CONFIG.pipeDespawnX - pad ||
      x > CONFIG.dragonOffScreenX + pad ||
      y < CONFIG.groundY - pad ||
      y > CONFIG.ceilingY + pad
    );
  }
}
