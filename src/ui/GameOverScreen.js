/**
 * Game Over screen (GameState.GAME_OVER). Play Again calls the public
 * game.requestRestart() (-> READY, same as flapping to retry) and Main
 * Menu calls game.returnToMenu() (-> MENU, resets bird/pipes/score).
 * These are deliberately separate methods since they're different
 * flows, even though both are reachable from here.
 */
export class GameOverScreen {
  constructor(game) {
    this.game = game;

    this.root = document.createElement('div');
    this.root.className = 'screen game-over';
    this.root.innerHTML = `
      <div class="panel">
        <h2 class="title-sm">Game Over</h2>
        <p class="final-score">Score: <span data-score>0</span></p>
        <p class="best-score">Best: <span data-best>0</span></p>
        <p class="final-score">Coins: <span data-coins-run>0</span></p>
        <p class="best-score">Total Coins: <span data-coins-total>0</span></p>
        <button class="btn btn-primary" data-retry>Play Again</button>
        <button class="btn btn-secondary" data-menu>Main Menu</button>
      </div>
    `;

    this.scoreLabel = this.root.querySelector('[data-score]');
    this.bestLabel = this.root.querySelector('[data-best]');
    this.coinsRunLabel = this.root.querySelector('[data-coins-run]');
    this.coinsTotalLabel = this.root.querySelector('[data-coins-total]');

    this.root.querySelector('[data-retry]').addEventListener('click', () => {
      this.game.audioManager.playUiClick();
      this.game.requestRestart();
    });

    this.root.querySelector('[data-menu]').addEventListener('click', () => {
      this.game.audioManager.playUiClick();
      this.game.returnToMenu();
    });
  }

  show(finalScore) {
    this.scoreLabel.textContent = String(finalScore);
    this.bestLabel.textContent = String(this.game.scoreSystem.best);
    this.coinsRunLabel.textContent = String(this.game.coinSystem.run);
    this.coinsTotalLabel.textContent = String(this.game.coinSystem.total);
    this.root.classList.add('visible');
  }

  hide() {
    this.root.classList.remove('visible');
  }
}
