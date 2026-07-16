import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

// Round-robin order the four patterns are cycled through. Phase 5.6's
// difficulty scaling will restrict which of these a given Dragon
// fight can pick (Dragon I = fireball only, etc); for now every
// pattern is always in rotation (docs/phase5-encounters.md's baseline
// "Dragon I / II / III" numbers aren't gated yet).
const PATTERN_ORDER = ['fireball', 'fireBreath', 'dive', 'tailSwipe'];

/**
 * Owns attack-pattern timing/selection for a boss encounter
 * (docs/phase5-encounters.md's "Attack System" section - "Only one
 * pattern is active at a time"). Phase 5.3 wired up Fireball only;
 * Phase 5.4 adds Fire Breath, Dive, and Tail Swipe as siblings plus
 * the pattern-switching state machine below - DragonEncounter and
 * Dragon didn't need to change for any of the three except one small
 * hook (see `isControllingDragon`).
 *
 * Deliberately dumb about *why* it's firing - it just knows the
 * dragon to fire from, the bird to aim at, and where to hand off
 * spawned projectiles. DragonEncounter owns calling `update()` only
 * while the fight is ACTIVE, so attacks naturally never fire during
 * the intro/outro fly-in/out.
 *
 * Every pattern but Dive is "fire and forget": it hands a hazard off
 * to ProjectileSystem and the dragon itself never moves. Dive is
 * different - the hazard *is* the dragon, so this class temporarily
 * takes over `dragon.group.position` directly (both x and y) for the
 * duration of the windup/charge/return. `isControllingDragon` is how
 * DragonEncounter knows to skip Dragon's normal height-follow update
 * on those frames instead of fighting over position.
 */
export class AttackController {
  constructor({ dragon, bird, projectileSystem }) {
    this.dragon = dragon;
    this.bird = bird;
    this.projectileSystem = projectileSystem;

    this._patternIndex = -1; // bumped to 0 by the first _startNextPattern() call
    this._state = 'cooldown';
    this._stateTimer = 0;
    this._activeDuration = 0;

    // First attack arrives sooner than a full cooldown so the fight
    // doesn't feel like it's stalling right after the intro finishes.
    this._cooldownTarget = CONFIG.attackCooldown * 0.4;

    // Dive-only scratch state - the charge height is locked in at the
    // end of the windup so the charge itself is a straight, predictable line.
    this._diveTargetY = 0;
  }

  /**
   * True while this controller is directly driving the dragon's
   * transform (Dive's windup/charge/return) - DragonEncounter must
   * skip Dragon's own update() those frames, see class doc above.
   */
  get isControllingDragon() {
    return this._state === 'dive-windup' || this._state === 'dive-charge' || this._state === 'dive-return';
  }

  /** Call once per frame while the encounter's ACTIVE phase owns gameplay. */
  update(delta) {
    this._stateTimer += delta;

    switch (this._state) {
      case 'cooldown':
        if (this._stateTimer >= this._cooldownTarget) this._startNextPattern();
        break;
      case 'fireBreath-warn':
        this._updateFireBreathWarn();
        break;
      case 'dive-windup':
        this._updateDiveWindup();
        break;
      case 'dive-charge':
        this._updateDiveCharge(delta);
        break;
      case 'dive-return':
        this._updateDiveReturn();
        break;
      case 'fireBreath-active':
      case 'tailSwipe-active':
        if (this._stateTimer >= this._activeDuration) this._enterCooldown();
        break;
      default:
        break;
    }
  }

  /**
   * True if the dragon's own body (mid-charge, Dive only) just
   * overlapped the bird. The dragon isn't a pooled projectile, so
   * ProjectileSystem.checkHit() can't see it - this is the sibling
   * check DragonEncounter.checkHit() also calls.
   */
  checkDiveHit(bird) {
    if (this._state !== 'dive-charge') return false;
    const pos = this.dragon.getPosition();
    const birdPos = bird.getPosition();
    const dx = pos.x - birdPos.x;
    const dy = pos.y - birdPos.y;
    const hitDistance = CONFIG.diveHitRadius + 0.25; // + a rough bird half-size
    return dx * dx + dy * dy < hitDistance * hitDistance;
  }

  _startNextPattern() {
    this._patternIndex = (this._patternIndex + 1) % PATTERN_ORDER.length;
    this._stateTimer = 0;

    switch (PATTERN_ORDER[this._patternIndex]) {
      case 'fireball':
        this._fireFireball();
        this._enterCooldown();
        break;
      case 'fireBreath':
        this._state = 'fireBreath-warn';
        break;
      case 'dive':
        this._state = 'dive-windup';
        break;
      case 'tailSwipe':
        this._fireTailSwipe();
        this._state = 'tailSwipe-active';
        this._activeDuration = CONFIG.tailSwipeActiveDuration;
        break;
      default:
        this._enterCooldown();
    }
  }

  _enterCooldown() {
    this._state = 'cooldown';
    this._stateTimer = 0;
    this._cooldownTarget = CONFIG.attackCooldown;
  }

  // --- Fireball (Phase 5.3) ---

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

  // --- Fire Breath (Phase 5.4) ---

  _updateFireBreathWarn() {
    if (this._stateTimer < CONFIG.fireBreathWarnDuration) return;
    this._fireFireBreath();
    this._state = 'fireBreath-active';
    this._stateTimer = 0;
    this._activeDuration = CONFIG.fireBreathActiveDuration;
  }

  _fireFireBreath() {
    const origin = this.dragon.getPosition();
    const spawnX = origin.x - 1.1; // snout tip, same as the fireball's spawn point
    // Gap aims at the bird's height right as the breath launches -
    // reactive like the fireball, but now the bird has to hold a lane
    // instead of dodging a single point.
    const gapCenterY = THREE.MathUtils.clamp(
      this.bird.getPosition().y,
      CONFIG.dragonMinY + CONFIG.fireBreathGapHeight / 2,
      CONFIG.dragonMaxY - CONFIG.fireBreathGapHeight / 2
    );
    this.projectileSystem.spawnFireBreath(spawnX, gapCenterY);
  }

  // --- Tail Swipe (Phase 5.4) ---

  _fireTailSwipe() {
    const origin = this.dragon.getPosition();
    const spawnX = origin.x + 0.3; // just past the tail's resting position (Dragon.js's tail sits at local x=+0.55)
    this.projectileSystem.spawnTailSwipe(spawnX, origin.y);
  }

  // --- Dive (Phase 5.4) ---

  _updateDiveWindup() {
    const t = this._eased(this._stateTimer / CONFIG.diveWindupDuration);
    const x = THREE.MathUtils.lerp(CONFIG.dragonOnScreenX, CONFIG.dragonOffScreenX, t);
    // Height keeps loosely tracking the bird right up until the charge
    // locks in, so the retreat still feels alive instead of scripted.
    const y = THREE.MathUtils.lerp(this.dragon.getPosition().y, this.bird.getPosition().y, 0.08);
    this.dragon.setPosition(x, y);

    if (this._stateTimer >= CONFIG.diveWindupDuration) {
      this._diveTargetY = THREE.MathUtils.clamp(this.bird.getPosition().y, CONFIG.dragonMinY, CONFIG.dragonMaxY);
      this.dragon.setPosition(CONFIG.dragonOffScreenX, this._diveTargetY);
      this._state = 'dive-charge';
      this._stateTimer = 0;
    }
  }

  _updateDiveCharge(delta) {
    const x = this.dragon.getPosition().x - CONFIG.diveChargeSpeed * delta;
    this.dragon.setPosition(x, this._diveTargetY);

    if (x <= CONFIG.pipeDespawnX - 1.5) {
      // Off the left edge and invisible either way - teleport straight
      // to the off-screen-right mark instead of easing back across the
      // visible play area a second time.
      this.dragon.setPosition(CONFIG.dragonOffScreenX, this._diveTargetY);
      this._state = 'dive-return';
      this._stateTimer = 0;
    }
  }

  _updateDiveReturn() {
    const t = this._eased(this._stateTimer / CONFIG.diveReturnDuration);
    const x = THREE.MathUtils.lerp(CONFIG.dragonOffScreenX, CONFIG.dragonOnScreenX, t);
    const y = THREE.MathUtils.lerp(this._diveTargetY, this.bird.getPosition().y, t);
    this.dragon.setPosition(x, y);

    if (this._stateTimer >= CONFIG.diveReturnDuration) {
      this.dragon.group.position.x = CONFIG.dragonOnScreenX; // guarantee it's exactly on its mark, same reasoning as DragonEncounter._onActiveStart
      this._enterCooldown();
    }
  }

  /** 0-1 smoothstep easing, shared by the dive's windup/return tweens. */
  _eased(t) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1);
    return clamped * clamped * (3 - 2 * clamped);
  }
}
