# Flappy Bird 3D — Phase 4

Retro PS1/N64-inspired low-poly Flappy Bird remake, built with Three.js + Vite.

## Status: Phase 1 + Phase 2 + Phase 3 + Phase 4 complete ✅

- [x] Three.js + Vite scaffold
- [x] Scene (fog, lighting)
- [x] Camera (perspective, resize-aware)
- [x] Renderer (retro low-res pixelated pipeline, now adaptive - see Phase 4)
- [x] Input (keyboard / mouse / touch normalized to `flap` / `pause`)
- [x] Bird (gravity, jump, tilt, wing-flap animation, collision box)
- [x] Pipes (randomized gap, object-pooled, recycled, merged geometry — see Phase 4)
- [x] Ground (endless scrolling, segment-recycled)
- [x] Physics (gravity integration in `Bird.update`)
- [x] Collision (`Box3` bird-vs-pipe, bird-vs-ground)
- [x] Score (per-pipe scoring via `ScoreSystem`, persisted best score)
- [x] State machine (MENU → READY → PLAYING → GAME_OVER, PAUSED from PLAYING)
- [x] UI (Main Menu, HUD, Pause overlay, Game Over screen)
- [x] Audio (synthesized flap/point/hit/die/UI-click SFX + a procedural music loop, all via Web Audio API — no asset files)
- [x] Animations (squash-and-stretch on the bird's body)
- [x] Camera shake (trauma-based, triggers on death)
- [x] Particles (feather burst on death, dust puff on landing)
- [x] Optimization (adaptive render resolution, merged pipe geometry, shared particle geometry)
- [x] Mobile (safe-area-aware HUD, touch-action hardening, auto-pause on backgrounding)
- [ ] Leaderboards / Cosmetics / Day-Night — Phase 5

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (defaults to http://localhost:5173).

## What you should see

Same flow as Phase 3 (Main Menu → READY → PLAYING → GAME_OVER, with a
Pause overlay reachable mid-run), but now:

- The game keeps itself smooth automatically — `PerformanceMonitor`
  watches average FPS and nudges the internal render resolution down
  if it's struggling (or back up if there's headroom), so slower or
  mobile GPUs stay playable without a settings menu.
- Switching tabs or apps mid-run (backgrounding the page) auto-pauses
  instead of letting the bird die unfairly while you weren't looking.
- On phones: pinch-zoom, pull-to-refresh, and long-press callouts are
  disabled so a tap always just flaps; buttons respect the notch/home
  indicator via `env(safe-area-inset-*)`; taps register immediately
  (no double-tap-zoom delay).
- Pipes render as 2 meshes each instead of 4 (body+cap merged into one
  vertex-colored geometry per side) — same look, fewer draw calls.

## Playtesting notes

- `CONFIG` in `src/utils/Constants.js` is still the single tuning
  surface. Phase 4 added a performance block:
  `minResolutionScale/maxResolutionScale` (the range PerformanceMonitor
  is allowed to scale within), `perfSampleWindow/perfMinFps/perfGoodFps`
  (how it judges "struggling" vs "has headroom"), `perfAdjustCooldown`
  and `perfScaleStep` (how fast/gradually it reacts — tuned to avoid
  visible resolution flicker).
- `RendererManager.setResolutionScale()` is the only thing that
  changes resolution now; `CONFIG.renderResolutionScale` is just the
  *starting* value, not a hard-coded constant anymore.
- Pipe collision boxes are computed analytically from known dimensions
  (`Pipe._updateBoxes()`) rather than via `Box3.setFromObject()` on a
  mesh — this decouples hitbox math from the (now merged, wider-cap)
  render geometry and skips a matrix-world update per pipe per frame.
- Best score persists across reloads via `localStorage` (falls back to
  session-only if storage is unavailable, e.g. private browsing).
- Difficulty scaling (`CONFIG.difficultyStep`, etc.) is still defined
  but not wired up — same as Phase 2/3, left for a later pass.

## Why it looks chunky/pixelated already

`RendererManager` starts at `CONFIG.renderResolutionScale` (35% of your
window resolution) and lets CSS (`image-rendering: pixelated`) upscale it
with hard edges — that's the PS1/N64 look from the art direction doc, no
shaders needed. As of Phase 4 this value can drift at runtime (see
Optimization above) but stays clamped between `minResolutionScale` and
`maxResolutionScale`, so it's always at least that chunky.

## Project structure

```
index.html               # Entry point
package.json            # Dependencies
vite.config.js          # Vite configuration
README.md               # This file
public/                 # Static assets
  models/               # 3D model files
  textures/             # Texture files

src/
  main.js               # Application entry point
  styles.css            # Global styles
  core/                 # Core game systems
    Game.js             # Main game loop & state machine
    CameraManager.js    # Camera & shake system
    RendererManager.js  # Renderer with adaptive resolution
    SceneManager.js     # Three.js scene setup
    InputManager.js     # Input handling (keyboard, mouse, touch)
    PerformanceMonitor.js # FPS monitoring & resolution scaling
  entities/             # Game entities
    Bird.js             # Player bird with gravity & animation
    Pipe.js             # Pipe obstacles (merged geometry)
    Ground.js           # Scrolling ground
    Coin.js             # Collectible coins
  systems/              # Game systems
    ObjectPool.js       # Object pooling for performance
    PipeSpawner.js      # Pipe spawning & difficulty scaling
    CollisionSystem.js  # Collision detection
    ScoreSystem.js      # Score tracking & persistence
    CoinSystem.js       # Coin spawning & collection
    ShopSystem.js       # Shop & cosmetics system
  audio/                # Audio management
    AudioManager.js     # Synthesized SFX & music loop
  effects/              # Visual effects
    ParticleSystem.js   # Pooled particle effects (feathers, dust)
  ui/                   # User interface
    UIManager.js        # Main UI controller
    MainMenu.js         # Start menu
    Hud.js              # In-game HUD
    PauseOverlay.js     # Pause menu
    GameOverScreen.js   # Game over screen
    ShopScreen.js       # Shop interface
  utils/                # Utilities
    Constants.js        # Game configuration & constants
    EventEmitter.js     # Event system
```

## Architecture notes

- **One-way UI dependency**: `UIManager` and its screens read game
  state through `game.emitter` events (`stateChange`, `score`,
  `pointScored`, `gameOver`) and call public methods
  (`game.startGame()`, `game.requestRestart()`, `game.returnToMenu()`).
  `Game` itself only imports `UIManager` to construct it — nothing in
  `core/`, `entities/`, or `systems/` reaches back into `ui/`.
- **MENU vs READY**: the Main Menu's Play button calls
  `game.startGame()` (MENU → READY); the first actual flap from there
  starts PLAYING, same as Phase 2's flow. This means flap input stays
  fully inert while the menu is up.
- **Camera shake** (`CameraManager.shake(amount)`) adds "trauma" (0-1,
  clamped, decays over time); `update(delta)` turns current trauma
  into a small positional/rotational offset on top of the camera's
  fixed base position, using trauma² so small amounts barely
  shake and it ramps up fast near 1. `Game._onDeath()` is the only
  place that currently calls `shake()`.
- **Particles**: `ParticleSystem` pools a fixed number of quads
  (`CONFIG.particlePoolSize`) up front, all sharing one geometry;
  `burstFeathers()`/`burstDust()` just configure idle ones rather than
  allocating new meshes.
- **Adaptive performance**: `PerformanceMonitor` samples FPS over a
  rolling window (`CONFIG.perfSampleWindow`) and, at most once per
  `perfAdjustCooldown` seconds, nudges `RendererManager`'s resolution
  scale by `perfScaleStep` toward whichever bound keeps frame rate in
  the `perfMinFps`–`perfGoodFps` band. It runs every frame regardless
  of game state, so it reacts just as well to a laggy menu as a laggy
  run.

# FLP-BRD-Threejs
