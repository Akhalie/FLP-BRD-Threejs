import { CONFIG } from '../utils/Constants.js';

/**
 * Owns attack-pattern timing/selection for a boss encounter
 * (docs/phase5-encounters.md's "Attack System" section - "Only one
 * pattern is active at a time"). Phase 5.3 wires up only the Fireball
 * pattern; Fire Breath / Dive / Tail Swipe land in Phase 5.4 as
 * sibling `_fireX()` methods plus a pattern switch in `update()`,
 * without DragonEncounter or Dragon needing to change.
 *
 * Deliberately dumb about *why* it's firing - it just knows the
 * dragon to fire from, the bird to aim at, and where to hand off
 * spawned projectiles. DragonEncounter owns calling `update()` only
 * while the fight is ACTIVE, so attacks naturally never fire during
 * the intro/outro fly-in/out.
 */
export class AttackController {
  constructor({ dragon, bird, projectileSystem }) {
    this.dragon = dragon;
    this.bird = bird;
    this.projectileSystem = projectileSystem;

    // First shot arrives sooner than a full interval so the fight
    // doesn't feel like it's stalling right after the intro finishes.
    this._fireTimer = CONFIG.fireballInterval * 0.5;
  }

  /** Call once per frame while the encounter's ACTIVE phase owns gameplay. */
  update(delta) {
    this._fireTimer += delta;
    if (this._fireTimer >= CONFIG.fireballInterval) {
      this._fireTimer = 0;
      this._fireFireball();
    }
  }

  _fireFireball() {
    const origin = this.dragon.getPosition();
    // Roughly the dragon's snout tip (Dragon.js's head sits at local
    // x=-0.75, snout extends a bit further) rather than its body center.
    const spawnX = origin.x - 1.1;
    const spawnY = origin.y + 0.18;

    const target = this.bird.getPosition();
    const dx = target.x - spawnX;
    const dy = target.y - spawnY;
    const distance = Math.max(0.001, Math.hypot(dx, dy));

    const vx = (dx / distance) * CONFIG.fireballSpeed;
    const vy = (dy / distance) * CONFIG.fireballSpeed;

    this.projectileSystem.spawnFireball(spawnX, spawnY, vx, vy);
  }
}
