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
      <div class="hud-warning" data-warning>⚠ WARNING ⚠</div>
      <div class="hud-survive" data-survive>
        <div class="hud-survive-label">SURVIVE</div>
        <div class="hud-survive-track"><div class="hud-survive-fill" data-survive-fill></div></div>
      </div>
    `;

    this.scoreLabel = this.root.querySelector('[data-score]');
    this.coinsLabel = this.root.querySelector('[data-coins]');
    this.hintLabel = this.root.querySelector('[data-hint]');
    this.warningEl = this.root.querySelector('[data-warning]');
    this.surviveEl = this.root.querySelector('[data-survive]');
    this.surviveFillEl = this.root.querySelector('[data-survive-fill]');

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

    // Drives the WARNING flash / SURVIVE bar purely from encounter
    // events - tracked locally so this never has to import
    // EncounterManager's internal phase enum (see EncounterManager.js).
    // 'gameOver' is included so a death mid-encounter still clears both,
    // even though 'encounterEnd' never fires in that case.
    this._encounterPhase = 'IDLE';
    this.game.emitter.on('encounterWarning', () => { this._encounterPhase = 'WARNING'; });
    this.game.emitter.on('encounterStart', () => { this._encounterPhase = 'ACTIVE'; });
    this.game.emitter.on('encounterEnd', () => { this._encounterPhase = 'IDLE'; });
    this.game.emitter.on('gameOver', () => { this._encounterPhase = 'IDLE'; });

    this._boundTick = this._tick.bind(this);
    requestAnimationFrame(this._boundTick);
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

  /** Runs every frame for this Hud instance's lifetime; cheap enough that it isn't worth gating on visibility. */
  _tick() {
    requestAnimationFrame(this._boundTick);

    this.warningEl.classList.toggle('visible', this._encounterPhase === 'WARNING');
    this.surviveEl.classList.toggle('visible', this._encounterPhase === 'ACTIVE');

    if (this._encounterPhase !== 'ACTIVE') return;

    const manager = this.game.encounterManager;
    const duration = manager.current ? manager.current.duration : 1;
    const fraction = duration > 0 ? manager.timeRemaining / duration : 0;
    this.surviveFillEl.style.width = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
  }
}
