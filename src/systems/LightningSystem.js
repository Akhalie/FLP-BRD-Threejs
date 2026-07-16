import { CONFIG } from '../utils/Constants.js';
import { WarningIndicator } from '../ui/WarningIndicator.js';

/**
 * Handles every lightning strike during the Storm encounter (docs/storm.md's
 * "Lightning Strike" section: a warning always precedes the actual strike).
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
    this.strikeX = 0;
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

  /** WARNING begins: picks a strike x near the bird's current position and shows the indicator there. */
  beginStrike() {
    this.state = 'WARNING';
    this.timer = 0;
    this.strikeX = this.context.bird.getPosition().x + (Math.random() * CONFIG.stormLightningSpread - CONFIG.stormLightningSpread * 0.5);
    this.warning.show(this.strikeX);
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

  /** True only during the STRIKE window, and only within stormLightningWidth of the strike's x. */
  checkHit(bird) {
    if (this.state !== 'STRIKE') return false;
    return Math.abs(bird.getPosition().x - this.strikeX) < CONFIG.stormLightningWidth;
  }

  dispose() {
    this.warning.dispose();
  }
}
