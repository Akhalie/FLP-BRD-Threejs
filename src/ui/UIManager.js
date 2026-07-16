import { GameState } from '../utils/Constants.js';
import { MainMenu } from './MainMenu.js';
import { Hud } from './Hud.js';
import { PauseOverlay } from './PauseOverlay.js';
import { GameOverScreen } from './GameOverScreen.js';
import { ShopScreen } from './ShopScreen.js';

/**
 * Single owner of every UI screen. The dependency is one-way: UI
 * reads Game's state through events ('stateChange', 'gameOver') and
 * calls Game's public methods (startGame/requestRestart/returnToMenu)
 * - Game itself never imports or references UIManager. That keeps the
 * game loop/state machine testable and reusable without a DOM.
 */
export class UIManager {
  constructor(uiRoot, game) {
    this.uiRoot = uiRoot;
    this.game = game;

    this.mainMenu = new MainMenu(game);
    this.hud = new Hud(game);
    this.pauseOverlay = new PauseOverlay(game);
    this.gameOverScreen = new GameOverScreen(game);
    this.shopScreen = new ShopScreen(game);

  this.uiRoot.append(
    this.mainMenu.root,
    this.hud.root,
    this.pauseOverlay.root,
    this.gameOverScreen.root,
    this.shopScreen.root
  );
    game.emitter.on('stateChange', (state) => this._onStateChange(state));
    game.emitter.on('gameOver', (score) => this.gameOverScreen.show(score));

    this._onStateChange(game.state); // sync initial screen (MENU) on boot
  }

  showShop() {
    this.mainMenu.hide();
    this.shopScreen.show();
  }

  hideShop() {
    this.shopScreen.hide();
    this.mainMenu.show();
  }

  _onStateChange(state) {
    this.shopScreen.hide();
    
    const showMenu = state === GameState.MENU;
    const showHud =
      state === GameState.READY ||
      state === GameState.PLAYING ||
      state === GameState.ENCOUNTER;
    const showPause = state === GameState.PAUSED;
    // The HUD score/pause button stay visible under the pause overlay
    // so the score doesn't visually disappear while paused.
    const keepHudUnderPause = state === GameState.PAUSED;

    if (showMenu) this.mainMenu.show();
    else this.mainMenu.hide();

    if (showHud || keepHudUnderPause) {
      this.hud.show();
      this.hud.onStateChange(state);
    } else {
      this.hud.hide();
    }

    if (showPause) this.pauseOverlay.show();
    else this.pauseOverlay.hide();

    if (state !== GameState.GAME_OVER) this.gameOverScreen.hide();
  }
}
