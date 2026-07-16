import { CONFIG } from '../utils/Constants.js';
import { CloudSystem } from './CloudSystem.js';
import { WindSystem } from './WindSystem.js';
import { LightningSystem } from './LightningSystem.js';
import { RainSystem } from './RainSystem.js';
import { TornadoSystem } from './TornadoSystem.js';

/**
 * Owns every weather subsystem for the Storm encounter (docs/storm.md's
 * "Storm Controller" section: rain/cloud movement, wind zones, lightning
 * strikes, tornadoes, and fog transitions - all in one place).
 *
 * StormEncounter never directly manipulates clouds, wind, lightning,
 * rain, or tornadoes - it only calls through this class, the same way
 * DragonEncounter never reaches past AttackController into
 * ProjectileSystem directly.
 */
export class StormController {
  constructor(context) {
    this.context = context;

    this.clouds = null;
    this.wind = null;
    this.lightning = null;
    this.rain = null;
    this.tornado = null;
  }

  /** Encounter start: darken the fog and spin up every subsystem, but leave wind/lightning/tornado dormant until beginStorm(). */
  start() {
    const { scene, sceneManager } = this.context;

    sceneManager?.darkenFog(CONFIG.stormFogDarken);

    this.clouds = new CloudSystem(scene);
    this.wind = new WindSystem(scene);
    this.lightning = new LightningSystem(this.context);
    this.rain = new RainSystem(scene);
    this.tornado = new TornadoSystem(scene);

    this.clouds.start();
    this.wind.start();
    this.lightning.start();
    this.tornado.start();

    // Rain is atmospheric-only (docs/storm.md's "Heavy Rain" section), so
    // unlike wind/lightning/tornado it starts immediately with the rest
    // of the intro instead of waiting for the survival timer to begin.
    this.rain.enable();
  }

  /** INTRO: clouds roll in and rain falls while wind/lightning/tornado stay dormant (see StormController.updateIntro). */
  updateIntro(delta) {
    this.clouds?.update(delta);
    this.rain?.update(delta);
  }

  /** Called once when ACTIVE begins - wind zones, lightning strikes, and tornadoes only threaten (or help) the bird from here on. */
  beginStorm() {
    this.wind.enable();
    this.lightning.enable();
    this.tornado.enable();
  }

  /** ACTIVE: clouds drift, rain falls, wind pushes the bird's gravity, lightning cycles its warn/strike states, and a tornado may pass through and boost the bird. */
  update(delta) {
    this.clouds?.update(delta);
    this.rain?.update(delta);

    this.wind?.update(delta);
    this.wind?.applyToBird(this.context.bird);

    this.lightning?.update(delta);

    this.tornado?.update(delta);
    this.tornado?.applyToBird(this.context.bird);
  }

  /**
   * Survival timer just ran out - the fight is won. Wind/lightning/tornado
   * are disabled immediately so none can affect the bird during the outro
   * clear-up, after the win already happened (same reasoning as
   * DragonEncounter._onVictory() clearing in-flight fireballs). Rain
   * stops here too - "Rain Stops" is the first step of the Victory
   * Sequence in docs/storm.md.
   */
  stopStorm() {
    this.wind?.disable();
    this.lightning?.disable();
    this.tornado?.disable();
    this.rain?.disable();
  }

  /** OUTRO: clouds ease back to normal - rain/wind/lightning/tornado stay disabled from stopStorm(). */
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
    this.rain?.dispose();
    this.tornado?.dispose();

    this.context.sceneManager?.restoreFog();
  }
}
