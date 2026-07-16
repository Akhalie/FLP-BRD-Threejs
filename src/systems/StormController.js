import { CONFIG } from '../utils/Constants.js';
import { CloudSystem } from './CloudSystem.js';
import { WindSystem } from './WindSystem.js';
import { LightningSystem } from './LightningSystem.js';

/**
 * Owns every weather subsystem for the Storm encounter (docs/storm.md's
 * "Storm Controller" section: rain/cloud movement, wind zones, lightning
 * strikes, and fog transitions - all in one place).
 *
 * StormEncounter never directly manipulates clouds, wind, or lightning -
 * it only calls through this class, the same way DragonEncounter never
 * reaches past AttackController into ProjectileSystem directly.
 */
export class StormController {
  constructor(context) {
    this.context = context;

    this.clouds = null;
    this.wind = null;
    this.lightning = null;
  }

  /** Encounter start: darken the fog and spin up every subsystem, but leave wind/lightning dormant until beginStorm(). */
  start() {
    const { scene, sceneManager } = this.context;

    sceneManager?.darkenFog(CONFIG.stormFogDarken);

    this.clouds = new CloudSystem(scene);
    this.wind = new WindSystem();
    this.lightning = new LightningSystem(this.context);

    this.clouds.start();
    this.wind.start();
    this.lightning.start();
  }

  /** INTRO: only the clouds roll in - wind/lightning stay off until the survival timer actually begins. */
  updateIntro(delta) {
    this.clouds?.update(delta);
  }

  /** Called once when ACTIVE begins - wind zones and lightning strikes only threaten the bird from here on. */
  beginStorm() {
    this.wind.enable();
    this.lightning.enable();
  }

  /** ACTIVE: clouds keep drifting, wind pushes the bird's gravity, lightning advances its warn/strike cycle. */
  update(delta) {
    this.clouds?.update(delta);

    this.wind?.update(delta);
    this.wind?.applyToBird(this.context.bird);

    this.lightning?.update(delta);
  }

  /** Victory: wind/lightning disabled immediately so neither can land a hit during the outro clear-up. */
  stopStorm() {
    this.wind?.disable();
    this.lightning?.disable();
  }

  /** OUTRO: clouds/fog ease back to normal - wind/lightning stay disabled from stopStorm(). */
  updateOutro(delta) {
    this.clouds?.update(delta);
  }

  /** True if a live lightning strike just hit the bird - the storm's only hazard (see LightningSystem.checkHit). */
  checkHit(bird) {
    return this.lightning?.checkHit(bird) ?? false;
  }

  dispose() {
    this.clouds?.dispose();
    this.wind?.dispose();
    this.lightning?.dispose();

    this.context.sceneManager?.restoreFog();
  }
}
