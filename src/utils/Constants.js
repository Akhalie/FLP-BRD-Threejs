// Central place for tunable numbers so systems never hardcode magic values.

export const GameState = Object.freeze({
  MENU: 'MENU',
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
});

export const CONFIG = {
  // --- Retro rendering ---
  // We render at a fraction of the real canvas size, then let CSS
  // (image-rendering: pixelated) upscale it. This is what gives the
  // PS1/N64-era blocky look instead of smooth modern AA.
  renderResolutionScale: 0.35, // 1.0 = native res, lower = chunkier pixels
  pixelRatioCap: 1, // never use devicePixelRatio > 1, keeps it chunky

  // --- Camera ---
  cameraFov: 60,
  cameraNear: 0.1,
  cameraFar: 200,
  cameraPosition: { x: 0, y: 1.2, z: 8 },
  cameraLookAt: { x: 2, y: 1, z: 0 },

  // --- Scene / fog ---
  skyColor: 0x9fd1e6,
  fogColor: 0x9fd1e6,
  fogDensity: 0.035,

  // --- Physics (used from Phase 2 onward) ---
  gravity: -22,
  flapVelocity: 7.5,
  maxFallSpeed: -14,

  // --- World bounds ---
  groundY: -1.5,
  ceilingY: 5,

  // --- Pipes (used from Phase 2 onward) ---
  pipeSpeed: 3.2,
  pipeGap: 2.6,
  pipeSpawnInterval: 1.8,
  pipeSpawnX: 8,
  pipeDespawnX: -8,
  // Random range for the vertical center of the gap. Kept inside the
  // ground/ceiling bounds above so every gap is actually reachable.
  pipeGapCenterMin: 0,
  pipeGapCenterMax: 1.6,

  // --- Difficulty scaling (used from Phase 2 onward) ---
  difficultyStep: 10, // every N points
  difficultySpeedIncrease: 0.25,
  difficultyGapDecrease: 0.12,

  // --- Coins (one spawned in every pipe gap) ---
  // Coins are a currency tracked by CoinSystem, entirely separate from
  // score - collecting one never changes the score/best number. Kept
  // separate on purpose so a future cosmetics shop has something to spend.
  coinValue: 1, // coins awarded per pickup
  coinSpinSpeed: 3.2, // radians/sec, purely cosmetic spin
  coinSparkleCount: 10,

  // --- Menu (Phase 3) ---
  // Ground still crawls behind the main menu so the scene doesn't feel
  // frozen, but noticeably slower than gameplay so it reads as "idle".
  menuGroundSpeed: 0.6,

  // --- Camera shake (Phase 3) - trauma-based, see CameraManager ---
  cameraShakeTraumaOnDeath: 0.8, // 0-1, how much trauma a death adds
  cameraShakeDecayPerSecond: 1.6, // how fast trauma drains back to 0
  cameraShakeMaxOffset: 0.35, // world units, at trauma = 1
  cameraShakeMaxRotation: 0.06, // radians, at trauma = 1

  // --- Bird squash/stretch (Phase 3) ---
  squashOnFlap: 0.35, // 0-1, how pronounced the squash is right after a flap
  squashRecoverySpeed: 6, // how fast squash relaxes back to neutral scale

  // --- Particles (Phase 3) ---
  featherBurstCount: 14,
  dustPuffCount: 10,
  particlePoolSize: 32, // shared pool across both effect types

  // --- Audio (Phase 3) ---
  musicVolume: 0.18,
  sfxVolume: 0.35,

  // --- Performance / adaptive quality (Phase 4) ---
  // RendererManager starts at renderResolutionScale, but PerformanceMonitor
  // will nudge it between these bounds at runtime based on measured FPS -
  // this is what keeps low-end/mobile devices playable without a manual
  // settings menu, while still capping "high" quality at the same chunky
  // retro look (see RendererManager's doc comment).
  minResolutionScale: 0.2,
  maxResolutionScale: 0.45,
  perfSampleWindow: 1.0, // seconds of frame time averaged before judging FPS
  perfMinFps: 40, // sustained average below this triggers a downscale
  perfGoodFps: 55, // sustained average at/above this allows an upscale
  perfAdjustCooldown: 2.0, // seconds to wait between automatic scale changes
  perfScaleStep: 0.05,
};

export const INPUT_KEYS = Object.freeze({
  FLAP: [' ', 'Space', 'ArrowUp'],
  PAUSE: ['p', 'P', 'Escape'],
});
