import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';
import { BaseEncounter } from './BaseEncounter.js';
import { Dragon } from '../entities/Dragon.js';
import { ProjectileSystem } from '../systems/ProjectileSystem.js';
import { AttackController } from '../systems/AttackController.js';

/**
 * The dragon boss fight (docs/phase5-encounters.md's "Dragon
 * Encounter" section).
 *
 * Phase 5.2 covered the entity itself, its idle animation, and the
 * intro (fly onto screen) / outro (fly away) sequences. Phase 5.3
 * added its first real hazard - the Fireball attack, via
 * ProjectileSystem + AttackController - which only runs during the
 * ACTIVE phase, so it never interferes with the INTRO/OUTRO tweens
 * below. Phase 5.4 adds Fire Breath, Dive, and Tail Swipe: the first
 * two are more AttackController patterns and needed no changes here;
 * Dive needed one small addition - see `_onUpdateActive`'s
 * `isControllingDragon` check.
 *
 * Survival, not damage, is the win condition: BaseEncounter already
 * treats "the survival timer ran out" as victory (see its
 * `_enterOutro()`), so this class never needs its own HP/victory
 * logic - it only needs to look right while that timer runs, and (as
 * of 5.3) report back if a hazard it owns hits the bird first via
 * `checkHit()`.
 */
export class DragonEncounter extends BaseEncounter {
  constructor(context) {
    super(context);

    this.duration = CONFIG.dragonSurviveDuration;
    this.introDuration = CONFIG.dragonIntroDuration;
    this.outroDuration = CONFIG.dragonOutroDuration;

    this.dragon = null;
    this.projectileSystem = null;
    this.attackController = null;
  }

  _onStart() {
    const { scene, bird } = this.context;

    this.dragon = new Dragon();
    this.dragon.setPosition(CONFIG.dragonOffScreenX, CONFIG.dragonBaseY, 0);
    this.dragon.show();
    scene.add(this.dragon.group);

    // Start the follow target at the bird's current height so the
    // very first frame doesn't snap-lerp from the fallback dragonBaseY.
    this.dragon._displayY = bird.getPosition().y;

    this.projectileSystem = new ProjectileSystem(scene);
    this.attackController = new AttackController({
      dragon: this.dragon,
      bird,
      projectileSystem: this.projectileSystem,
    });
  }

  /** INTRO: dragon eases in from off-screen to its on-screen resting x while already tracking the bird's height. */
  _onUpdateIntro(delta) {
    const t = this._easedProgress(this.introDuration);
    const x = THREE.MathUtils.lerp(CONFIG.dragonOffScreenX, CONFIG.dragonOnScreenX, t);
    this.dragon.group.position.x = x;
    this.dragon.update(delta, this.context.bird.getPosition().y);
  }

  _onActiveStart() {
    // Guarantee it's exactly on its mark even if the intro tween's
    // last frame landed a hair short (frame-rate dependent stepping).
    this.dragon.group.position.x = CONFIG.dragonOnScreenX;
  }

  /**
   * ACTIVE: normally holds position on the right side of the screen
   * with only height following the bird, while AttackController fires.
   * During a Dive (Phase 5.4), AttackController takes over the
   * dragon's transform directly - `isControllingDragon` says so - so
   * this only advances Dragon's idle animation those frames instead of
   * calling the full update() and fighting over position.
   */
  _onUpdateActive(delta) {
    if (this.attackController.isControllingDragon) {
      this.dragon.tickAnimation(delta);
    } else {
      this.dragon.update(delta, this.context.bird.getPosition().y);
    }
    this.attackController.update(delta);
    this.projectileSystem.update(delta);
  }

  /**
   * True if a live hazard just hit the bird - Game.js treats this
   * exactly like a pipe hit. Covers every pooled projectile
   * (fireball/fire breath/tail swipe) via ProjectileSystem, plus the
   * Dive attack's own body-to-body check (the charging dragon isn't a
   * pooled projectile, so ProjectileSystem can't see it).
   */
  checkHit(bird) {
    if (!this.projectileSystem) return false;
    return this.projectileSystem.checkHit(bird.box) || this.attackController.checkDiveHit(bird);
  }

  /**
   * Survival timer just ran out - the fight is won. Any fireballs
   * still in flight are cleared immediately so a stray one can't kill
   * the bird during the outro fly-away, after the win already happened.
   */
  _onVictory() {
    if (this.projectileSystem) this.projectileSystem.reset();
  }

  /** OUTRO: dragon eases back off-screen the same way it arrived, still following height so it doesn't look frozen. */
  _onUpdateOutro(delta) {
    const t = this._easedProgress(this.outroDuration);
    const x = THREE.MathUtils.lerp(CONFIG.dragonOnScreenX, CONFIG.dragonOffScreenX, t);
    this.dragon.group.position.x = x;
    this.dragon.update(delta, this.context.bird.getPosition().y);
  }

  _onCleanup() {
    if (this.projectileSystem) {
      this.projectileSystem.reset(); // always safe to release an already-empty pool
      this.projectileSystem = null;
    }
    this.attackController = null;

    if (!this.dragon) return;
    this.context.scene.remove(this.dragon.group);
    this.dragon.dispose();
    this.dragon = null;
  }

  /** 0-1 smoothstep progress through the current phase, driven by BaseEncounter's own phase-elapsed timer. */
  _easedProgress(phaseDuration) {
    const t = phaseDuration > 0 ? THREE.MathUtils.clamp(this._phaseElapsed / phaseDuration, 0, 1) : 1;
    return t * t * (3 - 2 * t); // smoothstep - eases in and out instead of a linear glide
  }
}
