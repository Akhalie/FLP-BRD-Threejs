import { INPUT_KEYS } from '../utils/Constants.js';

/**
 * Normalizes keyboard / mouse / touch input into two semantic events:
 * 'flap' and 'pause'. Nothing downstream (Bird, Game state machine)
 * needs to know or care whether the player pressed Space, clicked,
 * or tapped a touchscreen - they just listen for 'flap'.
 */
export class InputManager {
  constructor(emitter, targetElement = window) {
    this.emitter = emitter;
    this.target = targetElement;
    this.enabled = true;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);

    this.target.addEventListener('keydown', this._onKeyDown);
    this.target.addEventListener('pointerdown', this._onPointerDown);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  _onKeyDown(event) {
    if (!this.enabled) return;

    if (INPUT_KEYS.FLAP.includes(event.key) || INPUT_KEYS.FLAP.includes(event.code)) {
      event.preventDefault();
      this.emitter.emit('flap');
      return;
    }

    if (INPUT_KEYS.PAUSE.includes(event.key) || INPUT_KEYS.PAUSE.includes(event.code)) {
      event.preventDefault();
      this.emitter.emit('pause');
    }
  }

  _onPointerDown(event) {
    if (!this.enabled) return;
    // Ignore clicks on real UI elements (buttons, menus) so a
    // "Restart" button click doesn't also register as a flap.
    if (event.target.closest('#ui-root')) return;
    this.emitter.emit('flap');
  }

  dispose() {
    this.target.removeEventListener('keydown', this._onKeyDown);
    this.target.removeEventListener('pointerdown', this._onPointerDown);
  }
}
