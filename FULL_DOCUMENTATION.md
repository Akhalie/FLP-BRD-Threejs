# Flap — Full Project Documentation

## Overview

Flap is a browser-based arcade game inspired by Flappy Bird. It uses modern JavaScript with Vite for development, organized into a lightweight engine with managers, entities, systems, effects, and UI modules.

## Features

- Smooth, physics-like bird movement and collisions
- Object pooling for performance
- Procedural pipe spawning with increasing difficulty
- Coin collection and scoring system
- UI screens: main menu, in-game HUD, pause, shop, game over
- Audio management and particle effects

## Tech Stack

- JavaScript (ES modules)
- Vite dev server and build
- Plain HTML/CSS for UI

## Quick Start

Prerequisites: Node.js (16+) and npm.

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Running locally (commands)

- Install: `npm install`
- Start dev server: `npm run dev`
- Build production: `npm run build`
- Preview build: `npm run preview`

## Controls

- Click / tap / press Spacebar: make the bird flap
- Escape / Pause button: open pause overlay

## Project Structure

Top-level files:

- `index.html` — game container and mount point
- `package.json` — scripts and dependencies
- `vite.config.js` — Vite configuration

Key folders and descriptions:

- `src/` — application source code
  - `main.js` — entry point, bootstraps the game
  - `styles.css` — global styles
  - `audio/AudioManager.js` — handles audio playback and pooling
  - `core/` — engine managers
    - `CameraManager.js` — camera and viewport handling
    - `Game.js` — main game loop and lifecycle
    - `InputManager.js` — input handling for mouse, touch, keyboard
    - `PerformanceMonitor.js` — optional performance diagnostics
    - `RendererManager.js` — canvas / rendering orchestration
    - `SceneManager.js` — scene and state management
  - `effects/ParticleSystem.js` — particle emitter for effects
  - `entities/` — game entities
    - `Bird.js` — player entity and physics
    - `Coin.js` — collectible entity
    - `Ground.js` — ground collider and visuals
    - `Pipe.js` — obstacles (top/bottom)
  - `systems/` — game logic systems
    - `CoinSystem.js` — coin spawning and collection logic
    - `CollisionSystem.js` — collision detection and responses
    - `ObjectPool.js` — pooling utilities for performant reuse
    - `PipeSpawner.js` — pipe generation and difficulty progression
    - `ScoreSystem.js` — scoring and highscore handling
    - `ShopSystem.js` — shop logic for unlocks or cosmetics
  - `ui/` — user interface screens and overlays
    - `GameOverScreen.js`, `Hud.js`, `MainMenu.js`, `PauseOverlay.js`, `ShopScreen.js`, `UIManager.js`
  - `utils/` — utilities
    - `Constants.js` — game constants and tunables
    - `EventEmitter.js` — lightweight pub/sub event system

- `public/` — static assets
  - `models/` — 3D or sprite models if used
  - `textures/` — image textures and sprites

## Architecture & Flow

1. `main.js` initializes `Game` and `SceneManager`.
2. `Game` starts the main loop via `requestAnimationFrame`, delegating update and render to managers.
3. `InputManager` translates user inputs into actions (flap, pause).
4. `Systems` (e.g., `CollisionSystem`, `ScoreSystem`) run in update phase to process game logic.
5. `RendererManager` draws entities each frame; `ParticleSystem` handles visual effects.
6. `AudioManager` plays sound effects and music.

This separation makes the code modular and easy to extend.

## Contributing

- Fork the repo and create a feature branch: `git checkout -b feat/your-change`
- Make changes and add tests where sensible
- Run the dev server to test locally
- Commit changes and open a pull request with a clear description

## Performance Tips

- Use object pooling (`systems/ObjectPool.js`) to avoid GC spikes
- Limit particle counts for mobile
- Reduce canvas resolution or scale on low-end devices

## Testing & Debugging

- Use `PerformanceMonitor.js` for runtime metrics
- Add console logs and breakpoints in `Game.js` and systems

## Known Locations to Tweak Gameplay

- `utils/Constants.js` — gravity, flap force, pipe gap, spawn rates
- `systems/PipeSpawner.js` — controls the difficulty curve
- `entities/Bird.js` — player physics and collision bounds

## Assets

Place large assets in `public/` and reference them by relative paths in the code. Consider optimizing images and audio for production.

## License

No license file is included. If you want to make the project open source, add a `LICENSE` file (MIT recommended for games).

## Contact / Credits

- Created and maintained by the project author. Add contributors to the `README.md` or `CONTRIBUTORS.md`.

---

If you'd like, I can also update the existing `README.md` to point to this full documentation or replace it.
