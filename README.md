# Flappy Bird 3D — Phase 5.5

Retro PS1/N64-inspired low-poly Flappy Bird remake, built with Three.js + Vite.

## Status: Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 5 (through 5.5) complete ✅

- [x] Three.js + Vite scaffold
- [x] Scene (fog, lighting)
- [x] Camera (perspective, resize-aware)
- [x] Renderer (retro low-res pixelated pipeline, adaptive — see Phase 4)
- [x] Input (keyboard / mouse / touch normalized to `flap` / `pause`)
- [x] Bird (gravity, jump, tilt, wing-flap animation, collision box)
- [x] Pipes (randomized gap, object-pooled, recycled, merged geometry)
- [x] Ground (endless scrolling, segment-recycled)
- [x] Physics (gravity integration in `Bird.update`)
- [x] Collision (`Box3` bird-vs-pipe, bird-vs-ground, bird-vs-encounter-hazard)
- [x] Score (per-pipe scoring via `ScoreSystem`, persisted best score)
- [x] State machine (MENU → READY → PLAYING → **ENCOUNTER** → GAME_OVER, PAUSED reachable from PLAYING or ENCOUNTER)
- [x] UI (Main Menu, HUD, Pause overlay, Game Over screen, Shop)
- [x] Audio (synthesized SFX + a procedural music loop that **crossfades into a boss theme** during encounters, all via Web Audio API — no asset files)
- [x] Animations (squash-and-stretch on the bird's body)
- [x] Camera shake (trauma-based, triggers on death **and** an encounter WARNING) plus a **separate zoom/tilt "boss framing"** during encounters
- [x] Particles (feather burst on death, dust puff on landing, coin sparkle on pickup/reward)
- [x] Optimization (adaptive render resolution, merged pipe geometry, shared particle geometry, pooled projectiles)
- [x] Mobile (safe-area-aware HUD, touch-action hardening, auto-pause on backgrounding)
- [x] Shop / cosmetics (coin-purchasable bird skins)
- [x] **Encounter system** (score-checkpoint-triggered interruptions of normal pipe gameplay — see Phase 5 below)
- [x] **Dragon boss fight** (Fireball, Fire Breath, Dive, Tail Swipe attack patterns)
- [x] **Encounter rewards** (bonus score/coins, victory particle burst, victory sound, screen flash + toast)
- [ ] Encounter difficulty scaling / additional attack patterns / balancing — Phase 5.6
- [ ] Storm / UFO / Volcano / Kraken / Haunted Forest / Sky Fortress encounters — future phases
- [ ] Leaderboards / Day-Night — future phases

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (defaults to http://localhost:5173).

## What you should see

Same MENU → READY → PLAYING flow as before, but the run is no longer
just an endless pipe corridor. At each score checkpoint
(`CONFIG.encounterCheckpoints` — 2, 50, 80, 120, 170, 250 by default),
normal gameplay pauses and an **Encounter** interrupts it:

1. **WARNING** — camera punches with a shake, fog darkens, and a
   flashing "⚠ WARNING ⚠" appears. New pipes stop spawning; whatever's
   already on screen keeps moving until it clears.
2. **Encounter begins** — for score 2/80/250 that's the **Dragon**: it
   flies in from off-screen, settles on the right side of the screen,
   and tracks the bird's height while cycling through attack patterns
   (Fireball, Fire Breath, Dive, Tail Swipe) roughly every
   `CONFIG.attackCooldown` seconds. The HUD swaps the score readout for
   a "SURVIVE" countdown bar. You don't need to damage the dragon —
   surviving the full `CONFIG.dragonSurviveDuration` seconds is the win
   condition, same as classic Flappy Bird's simple one-button rules.
   The other checkpoints (storm/ufo/volcano) are reserved slots that
   currently fall back to a silent survive-and-continue encounter until
   their concrete classes exist.
3. **Victory** — the moment the survival timer runs out: a rising
   4-note fanfare plays, a gold screen flash pulses, a "Dragon
   defeated!" toast pops up, bonus score and coins are awarded, and a
   sparkle burst fires at the bird. Meanwhile the dragon flies back off
   screen and the camera/music ease back to normal.
4. **Resume pipes** — new pipes start spawning again and score keeps
   counting toward the next checkpoint.

None of this is Dragon-specific plumbing — every encounter gets the
WARNING flash, the boss-music crossfade, the camera pull-back/tilt, and
the victory reward automatically just by existing (see Architecture
notes below), so future encounters (Storm, UFO, Volcano, ...) only need
to implement their own attack behavior.

## Playtesting notes

- `CONFIG` in `src/utils/Constants.js` is still the single tuning
  surface. Phase 5 additions worth knowing about:
  - `encounterCheckpoints` — the scripted progression of score →
    encounter type, consumed in order and never repeated.
  - `encounterWarningDuration`, `encounterPipeClearDuration`,
    `encounterMusicCrossfade`, `cameraShakeTraumaOnEncounterWarning`,
    `encounterFogDarkenFactor` — WARNING transition feel.
  - `dragonSurviveDuration`, `dragonIntroDuration`,
    `dragonOutroDuration`, `dragonOnScreenX`/`dragonOffScreenX`,
    `dragonFollowLerp`, `dragonMinY`/`dragonMaxY` — Dragon entity/timing.
  - `attackCooldown`, plus a block per attack
    (`fireballSpeed`, `fireBreathGapHeight`, `diveChargeSpeed`,
    `tailSwipeSweepRange`, etc.) — attack pattern tuning.
  - `cameraEncounterZoomOut`, `cameraEncounterTilt`,
    `cameraEncounterBlendSpeed` — the boss-fight camera framing, eased
    independently of the trauma-based shake.
- The bonus score (`10`) and bonus coins (`5`) awarded on encounter
  victory are currently hardcoded in `Game.js`'s `'encounterVictory'`
  listener rather than in `CONFIG` — flagged as Phase 5.6 cleanup.
- Boss music is a **sequential** crossfade (fade the running loop out,
  swap its pattern/tempo, fade back in), not two simultaneous loops —
  simpler to reason about for a two-note-chord chiptune arpeggio and
  visually/aurally reads the same as a true crossfade at this tempo.
- Dying mid-encounter skips the outro/reward entirely (no victory —
  same as dying normally), but the dragon, camera framing, and boss
  music are still guaranteed to clean up: `BaseEncounter.cleanup()` is
  the one place all of that reverts, and it always runs, whether the
  encounter finished normally or `EncounterManager.reset()` tore it
  down early (restart / return to menu).
- Best score and total coin wallet still persist across reloads via
  `localStorage` (session-only fallback if storage is unavailable).
- Difficulty scaling (`CONFIG.difficultyStep`, etc. for pipes; per-tier
  attack gating for the Dragon) is still a Phase 5.6 concern.

## Why it looks chunky/pixelated already

`RendererManager` starts at `CONFIG.renderResolutionScale` (35% of your
window resolution) and lets CSS (`image-rendering: pixelated`) upscale it
with hard edges — that's the PS1/N64 look from the art direction doc, no
shaders needed. This value can drift at runtime (`PerformanceMonitor`)
but stays clamped between `minResolutionScale` and `maxResolutionScale`,
so it's always at least that chunky.

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
    CameraManager.js    # Camera, shake, and encounter zoom/tilt framing
    RendererManager.js  # Renderer with adaptive resolution
    SceneManager.js     # Three.js scene setup, fog darken/restore
    InputManager.js     # Input handling (keyboard, mouse, touch)
    PerformanceMonitor.js # FPS monitoring & resolution scaling
  entities/             # Game entities
    Bird.js             # Player bird with gravity & animation
    Pipe.js             # Pipe obstacles (merged geometry)
    Ground.js            # Scrolling ground
    Coin.js              # Collectible coins
    Dragon.js             # Dragon boss entity (idle/follow/dive animation)
    Fireball.js           # Dragon fireball projectile
    FireBreath.js         # Dragon fire-breath wall hazard
    TailSwipe.js           # Dragon tail-swipe sweeping hazard
  encounters/            # Encounter definitions (Phase 5)
    BaseEncounter.js     # Shared lifecycle every encounter inherits:
                         # intro/active/outro timing, rewards, boss
                         # music crossfade, camera framing, cleanup
    DragonEncounter.js   # Dragon boss fight - entity + attack wiring
  systems/              # Game systems
    ObjectPool.js       # Object pooling for performance
    PipeSpawner.js      # Pipe spawning & difficulty scaling
    CollisionSystem.js  # Collision detection
    ScoreSystem.js      # Score tracking, persistence, encounter bonus
    CoinSystem.js       # Coin spawning & collection
    ShopSystem.js       # Shop & cosmetics system
    EncounterManager.js # Watches score checkpoints, owns the active
                         # encounter, drives WARNING → ENCOUNTER phases
    ProjectileSystem.js # Pooled projectiles shared by every attack
    AttackController.js # Picks/runs the Dragon's attack patterns
  audio/                # Audio management
    AudioManager.js     # Synthesized SFX, music loop + boss crossfade
  effects/              # Visual effects
    ParticleSystem.js   # Pooled particle effects (feathers, dust, sparkle)
  ui/                   # User interface
    UIManager.js        # Main UI controller
    MainMenu.js         # Start menu
    Hud.js               # In-game HUD: score, SURVIVE bar, WARNING
                         # flash, victory screen-flash/toast
    PauseOverlay.js      # Pause menu
    GameOverScreen.js    # Game over screen
    ShopScreen.js         # Shop interface
  utils/                # Utilities
    Constants.js         # Game configuration & constants
    EventEmitter.js      # Event system
```

## Architecture notes

- **One-way UI dependency**: `UIManager` and its screens read game
  state through `game.emitter` events (`stateChange`, `score`,
  `pointScored`, `bonusScored`, `coins`, `gameOver`,
  `encounterWarning`/`encounterStart`/`encounterEnd`/`encounterVictory`)
  and call public methods (`game.startGame()`, `game.requestRestart()`,
  `game.returnToMenu()`). `Game` itself only imports `UIManager` to
  construct it — nothing in `core/`, `entities/`, `systems/`, or
  `encounters/` reaches back into `ui/`.
- **MENU vs READY**: the Main Menu's Play button calls
  `game.startGame()` (MENU → READY); the first actual flap from there
  starts PLAYING. Flap input stays fully inert while the menu is up.
- **Camera shake** (`CameraManager.shake(amount)`) adds "trauma" (0-1,
  clamped, decays over time) for impact moments (death, encounter
  WARNING). Separately, **encounter framing**
  (`CameraManager.setEncounterMode(active)`) eases a steady pull-back +
  slow tilt in/out over `cameraEncounterBlendSpeed` — the two blend
  together independently in `update(delta)` since one is noise and the
  other is a deliberate camera move.
- **Particles**: `ParticleSystem` pools a fixed number of quads
  (`CONFIG.particlePoolSize`) up front, all sharing one geometry;
  `burstFeathers()`/`burstDust()`/`burstCoinSparkle()` just configure
  idle ones rather than allocating new meshes. Encounter victories reuse
  `burstCoinSparkle()` (doubled up) rather than adding a bespoke effect.
- **Adaptive performance**: `PerformanceMonitor` samples FPS over a
  rolling window and nudges `RendererManager`'s resolution scale toward
  whichever bound keeps frame rate in the target band. Runs every frame
  regardless of game state.
- **Encounter system** (Phase 5): `EncounterManager` watches
  `scoreSystem.score` against `CONFIG.encounterCheckpoints` (consumed
  in order, never repeated) and owns whichever encounter is currently
  active. `Game` only ever calls
  `checkCheckpoint()`/`update()`/`render()`/`checkHit()`/`reset()` on
  it and never imports a concrete encounter class — see
  `EncounterManagerPhase` (IDLE → WARNING → ENCOUNTER) vs.
  `GameState.ENCOUNTER`, which is the one state Game.js actually
  branches on.
- **`BaseEncounter`'s shared lifecycle** is the load-bearing piece that
  makes new encounters cheap to add: every encounter gets, for free,
  just by existing —
  - Intro/active/outro timing (`INTRO → ACTIVE → OUTRO → DONE`,
    survival-timer-based victory)
  - **Reward payout** (`_awardRewards()`, called from `_enterOutro()`
    regardless of what a subclass's own `_onVictory()` override does):
    particle burst, victory sound, and an `'encounterVictory'` event for
    `Game.js`/`Hud.js` to react to.
  - **Boss music crossfade** (`start()`/`cleanup()` call
    `audioManager.crossfadeToBoss()`/`crossfadeToNormal()`)
  - **Camera framing** (`start()`/`cleanup()` call
    `cameraManager.setEncounterMode(true/false)`)

  `cleanup()` is guaranteed to run exactly once per encounter — whether
  it finished normally or was torn down early by
  `EncounterManager.reset()` (death, restart, return-to-menu) — so the
  camera/music never get stuck in "boss mode".
- **Dragon encounter** (`DragonEncounter` + `Dragon`/`Fireball`/
  `FireBreath`/`TailSwipe` + `ProjectileSystem`/`AttackController`):
  survival, not damage, is the win condition — `BaseEncounter` already
  treats "the survival timer ran out" as victory, so `DragonEncounter`
  only needs to look right while that timer runs and report hazard hits
  back via `checkHit()`. `AttackController` picks one attack pattern at
  a time (`CONFIG.attackCooldown` between them); `ProjectileSystem`
  pools every fireball/fire-breath/tail-swipe hitbox so attacks never
  allocate mid-fight.