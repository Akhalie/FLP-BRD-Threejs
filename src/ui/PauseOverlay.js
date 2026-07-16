import { showScreen, hideScreen } from './panelTransition.js';

/**
 * Pause overlay (GameState.PAUSED). Resume re-emits 'pause' through
 * the same emitter InputManager uses, so it goes through the exact
 * same PLAYING<->PAUSED toggle as pressing Escape/P. Main Menu calls
 * game.returnToMenu() directly since that's a distinct flow (reset +
 * go to MENU) rather than a simple resume.
 */
export class PauseOverlay {
  constructor(game) {
    this.game = game;

    this.root = document.createElement('div');
    this.root.className = 'screen pause-overlay';
    this.root.innerHTML = `
      <div class="panel">
        <h2 class="title-sm">Paused</h2>
        <button class="btn btn-primary" data-resume>Resume</button>
        <button class="btn btn-secondary" data-menu>Main Menu</button>
      </div>
    `;

    this.root.querySelector('[data-resume]').addEventListener('click', () => {
      this.game.audioManager.playUiClick();
      this.game.emitter.emit('pause');
    });

    this.root.querySelector('[data-menu]').addEventListener('click', () => {
      this.game.audioManager.playUiClick();
      this.game.returnToMenu();
    });
  }

  show() {
    showScreen(this.root);
  }

  hide() {
    hideScreen(this.root);
  }
}
