import { CONFIG } from '../utils/Constants.js';
import { BaseEncounter } from './BaseEncounter.js';
import { StormController } from '../systems/StormController.js';

/**
 * The storm weather encounter (docs/storm.md).
 *
 * Unlike DragonEncounter, Storm has no single boss entity - there's
 * nothing to fly on/off screen, so this class only exists to drive
 * BaseEncounter's INTRO/ACTIVE/OUTRO lifecycle. Every actual weather
 * subsystem (clouds, wind zones, lightning) lives in StormController,
 * which this class constructs once in `_onStart()` and never reaches
 * past - it always calls through StormController's own methods
 * instead of touching CloudSystem/WindSystem/LightningSystem directly.
 *
 * Same win condition as every other encounter: BaseEncounter already
 * treats "the survival timer ran out" as victory, so this class has
 * no HP/victory logic of its own - it just needs the weather to look
 * right while that timer runs, and report hits (lightning strikes)
 * back via `checkHit()`.
 */
export class StormEncounter extends BaseEncounter {
  constructor(context) {
    super(context);

    this.duration = CONFIG.stormSurviveDuration;
    this.introDuration = CONFIG.stormIntroDuration;
    this.outroDuration = CONFIG.stormOutroDuration;

    this.storm = null;
  }

  _onStart() {
    this.storm = new StormController(this.context);
    this.storm.start();
  }

  /** INTRO: clouds roll in and fog darkens while wind/lightning stay dormant (see StormController.updateIntro). */
  _onUpdateIntro(delta) {
    this.storm.updateIntro(delta);
  }

  /** Wind zones and lightning only start posing a threat once the survival timer itself begins. */
  _onActiveStart() {
    this.storm.beginStorm();
  }

  /** ACTIVE: clouds keep drifting, wind pushes the bird's gravity, lightning cycles through its warn/strike states. */
  _onUpdateActive(delta) {
    this.storm.update(delta);
  }

  /**
   * Survival timer just ran out - the fight is won. Wind/lightning are
   * disabled immediately so neither can hit the bird during the outro
   * clear-up, after the win already happened (same reasoning as
   * DragonEncounter._onVictory() clearing in-flight fireballs).
   */
  _onVictory() {
    this.storm.stopStorm();
  }

  /** OUTRO: clouds/fog ease back to normal while wind/lightning stay disabled from _onVictory(). */
  _onUpdateOutro(delta) {
    this.storm.updateOutro(delta);
  }

  /** True if a live lightning strike just hit the bird - Game.js treats this exactly like a pipe hit. */
  checkHit(bird) {
    if (!this.storm) return false;
    return this.storm.checkHit(bird);
  }

  _onCleanup() {
    if (!this.storm) return;
    this.storm.dispose();
    this.storm = null;
  }
}
