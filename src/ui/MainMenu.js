import { showScreen, hideScreen } from './panelTransition.js';

/**
 * The main menu screen (GameState.MENU). Purely presentational - it
 * owns its DOM and visibility, but all it does on Play is call the
 * public game.startGame() method. It doesn't touch game state itself.
 */
export class MainMenu {
  constructor(game) {
    this.game = game;

    this.root = document.createElement('div');
    this.root.className = 'screen main-menu';
    this.root.innerHTML = `
<div class="panel">
  <h1 class="title">FLAPPY BIRD<span class="title-3d">3D</span></h1>

  <p class="subtitle">
    Best: <span data-best>0</span>
  </p>

  <p class="subtitle">
    <span aria-hidden="true">🪙</span> <span data-coins-total>0</span>
  </p>

  <div class="menu-buttons">
    <button class="btn btn-primary" data-play>
      Play
    </button>

    <button class="btn btn-secondary" data-shop>
      Shop
    </button>
  </div>

  <p class="hint">
    Space / Click / Tap to flap
  </p>
</div>
    `;

    this.bestLabel = this.root.querySelector('[data-best]');
    this.coinsTotalLabel = this.root.querySelector('[data-coins-total]');
    this.root.querySelector('[data-play]').addEventListener('click', () => {
      this.game.audioManager.resume();
      this.game.audioManager.playUiClick();
      this.game.startGame();
    });

    this.root.querySelector('[data-shop]').addEventListener('click', () => {
      this.game.audioManager.playUiClick();
      this.game.uiManager.showShop();
    }); 

      this.game.emitter.on('walletChanged', (total) => {
      this.coinsTotalLabel.textContent = String(total);
    });
    }

  show() {
    this.bestLabel.textContent = String(this.game.scoreSystem.best);
    this.coinsTotalLabel.textContent = String(this.game.coinSystem.total);
    showScreen(this.root);
  }

  hide() {
    hideScreen(this.root);
  }
}