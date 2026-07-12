import { GameState } from '../utils/Constants.js';

/**
 * In-game overlay: score (top-center), pause button (top-right), and
 * a hint that only shows in READY ("tap to flap") - it hides itself
 * the moment PLAYING starts. Visible during READY / PLAYING; hidden
 * for MENU / PAUSED / GAME_OVER (the pause/game-over screens sit on
 * top of it, so hiding avoids duplicate score readouts).
 */
export class Hud {
  constructor(game) {
    this.game = game;

    this.root = document.createElement('div');
    this.root.className = 'screen hud';
    this.root.innerHTML = `
      <div class="hud-score" data-score>0</div>
      <div class="hud-coins" data-coins>🪙 0</div>
      <button class="hud-pause-btn" data-pause aria-label="Pause">II</button>
      <div class="hud-hint" data-hint>Space / Click / Tap to flap</div>
    `;

    this.scoreLabel = this.root.querySelector('[data-score]');
    this.coinsLabel = this.root.querySelector('[data-coins]');
    this.hintLabel = this.root.querySelector('[data-hint]');

    this.root.querySelector('[data-pause]').addEventListener('click', () => {
      this.game.audioManager.playUiClick();
      this.game.emitter.emit('pause');
    });

    this.game.emitter.on('score', (score) => {
      this.scoreLabel.textContent = String(score);
    });

    this.game.emitter.on('coins', (run) => {
      this.coinsLabel.textContent = `🪙 ${run}`;
    });
  }

  show() {
    this.root.classList.add('visible');
  }

  hide() {
    this.root.classList.remove('visible');
  }

  /** Called on every stateChange while the HUD is visible, to toggle the hint. */
  onStateChange(state) {
    this.hintLabel.style.display = state === GameState.READY ? 'block' : 'none';
  }
}
