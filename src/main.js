import { Game } from './core/Game.js';
import { initRotateOverlay } from './core/MobileViewport.js';

initRotateOverlay();

const canvas = document.getElementById('game-canvas');
const uiRoot = document.getElementById('ui-root');

// Game owns and wires up its own UI (UIManager), audio (AudioManager),
// and everything else internally - main.js just boots it.
const game = new Game(canvas, uiRoot);
game.start();

// Handy for poking at the game from the browser devtools console
// during development (e.g. `__game.state`, `__game.scoreSystem.score`).
window.__game = game;
