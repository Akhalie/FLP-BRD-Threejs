import { CONFIG } from '../utils/Constants.js';
import { WarningIndicator } from '../ui/WarningIndicator.js';

/**
 * Handles every lightning strike during the Storm encounter (docs/storm.md's
 * "Lightning Strike" section: a warning always precedes the actual strike,
 * "on the ground or in the air").
 *
 * The bird never moves horizontally (it sits at a fixed x while the
 * world scrolls past - see Bird.js), so a strike that targets x gives
 * the player nothing to react with: whether it hits is decided the
 * instant it's rolled, before the warning even shows, no matter what
 * the player does with their one button. Strikes instead target one of
 * two vertical lanes - HIGH (near the ceiling) or LOW (near the
 * ground) - so flapping up or down during the warning is a real, fair
 * dodge: get to the other lane before the strike lands and it misses.
 *
 * Driven by a simple IDLE -> WARNING -> STRIKE state machine ticked from
 * update(delta) instead of setTimeout(), so pausing/resetting the game
 * mid-strike can't leave an orphaned timer waiting to fire later.
 */
export class LightningSystem {
  constructor(context) {
    this.context = context;
    this.warning = new WarningIndicator(context.scene);

    this.enabled = false;
    this.state = 'IDLE';
    this.timer = 0;
    this.strikeY = 0;
  }

  start() {
    this.state = 'IDLE';
    this.timer = 0;
  }

  /** Called once when the encounter's ACTIVE phase begins - strikes can't fire before this even though start() already ran. */
  enable() {
    this.enabled = true;
  }

  /** Called on victory so no strike can land (or leave its warning showing) during the outro. */
  disable() {
    this.enabled = false;
    this.warning.hide();
  }

  /** Advances the state machine: waits out IDLE, shows the warning through WARNING, then holds STRIKE for its hit-test window. */
  update(delta) {
    if (!this.enabled) return;
    this.timer += delta;

    switch (this.state) {
      case 'IDLE':
        if (this.timer >= CONFIG.stormLightningInterval) this.beginStrike();
        break;
      case 'WARNING':
        if (this.timer >= CONFIG.stormLightningWarnTime) this.strike();
        break;
      case 'STRIKE':
        if (this.timer >= CONFIG.stormLightningLife) {
          this.state = 'IDLE';
          this.timer = 0;
        }
        break;
    }
  }

  /** WARNING begins: rolls a HIGH or LOW lane and shows the indicator there, at the bird's current x so it's clearly in view. */
  beginStrike() {
    this.state = 'WARNING';
    this.timer = 0;

    const high = Math.random() > 0.5;
    this.strikeY = high ? CONFIG.stormLightningHighY : CONFIG.stormLightningLowY;
    this.warning.show(this.context.bird.getPosition().x, this.strikeY);
  }

  /** STRIKE begins: hides the warning and fires the screen flash / camera shake / thunder cue. */
  strike() {
    this.state = 'STRIKE';
    this.timer = 0;
    this.warning.hide();

    this.context.sceneManager?.flashLightning();
    this.context.cameraManager?.shake(CONFIG.stormLightningShake);
    this.context.audioManager?.playThunder?.();
  }

  /** True only during the STRIKE window, and only if the bird is still in the struck lane - flying to the other lane during WARNING avoids it entirely. */
  checkHit(bird) {
    if (this.state !== 'STRIKE') return false;
    return Math.abs(bird.getPosition().y - this.strikeY) < CONFIG.stormLightningWidth;
  }

  dispose() {
    this.warning.dispose();
  }
}
