// Central place for tunable numbers so systems never hardcode magic values.

export const GameState = Object.freeze({
  MENU: 'MENU',
  READY: 'READY',
  PLAYING: 'PLAYING',
  ENCOUNTER: 'ENCOUNTER',
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

  // --- Camera encounter framing (Phase 5.5) - see CameraManager.setEncounterMode() ---
  cameraEncounterZoomOut: 1.4, // extra world units of camera pull-back, at full blend
  cameraEncounterTilt: 0.035, // radians of constant roll, at full blend - "slow tilt", not shake
  cameraEncounterBlendSpeed: 1.2, // blend-fraction/sec eased toward the target (0 or 1) - ~0.8s to fully transition

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

  // --- Encounters (Phase 5) ---
  // Score checkpoints that trigger an encounter. EncounterManager consumes
  // these in order and never repeats one, so this list is also the run's
  // scripted progression (see docs/phase5-encounters.md). Only 'dragon'
  // exists as a real encounter so far - the rest are reserved checkpoint
  // slots that fall back to BaseEncounter's silent survive-and-continue
  // behaviour until their concrete classes exist.
  encounterCheckpoints: [
    { score: 2, type: 'storm' },
    { score: 15, type: 'dragon' },
    { score: 80, type: 'dragon' },
    { score: 120, type: 'ufo' },
    { score: 170, type: 'volcano' },
    { score: 250, type: 'dragon' },
  ],
  encounterWarningDuration: 1.6, // seconds the WARNING flash shows before the encounter actually starts
  encounterPipeClearDuration: 0.8, // seconds given for on-screen pipes/coins to clear out during the warning
  encounterMusicCrossfade: 1.2, // seconds to crossfade from retro loop to boss theme (and back)
  cameraShakeTraumaOnEncounterWarning: 0.4, // 0-1, punchier than a normal death shake so the WARNING reads as a big deal
  encounterFogDarkenFactor: 1.8, // multiplies fog density during an encounter, restored on encounterEnd

  // --- Dragon encounter (Phase 5.2) ---
  // Entity/animation + intro-outro tuning only - attack patterns
  // (fireball, fire breath, dive, tail swipe) land in Phase 5.3/5.4.
  dragonSurviveDuration: 15, // seconds - the ACTIVE-phase survival window (BaseEncounter's `duration`)
  dragonIntroDuration: 1.2, // seconds for the fly-in tween, played as BaseEncounter's INTRO phase
  dragonOutroDuration: 1.1, // seconds for the fly-away tween, played as BaseEncounter's OUTRO phase
  dragonOnScreenX: 5.5, // resting x once flown in - dragon "remains on the right side of the screen"
  dragonOffScreenX: 9.5, // starting/ending x for the fly-in/fly-away tween, outside the camera frustum
  dragonBaseY: 1.7, // y used while off-screen, before it has any bird position to follow
  dragonFollowLerp: 0.06, // per-frame lerp factor easing dragon.y toward the bird's height
  dragonMinY: -0.4, // clamps how low the dragon will dip to follow the bird (stays above the ground)
  dragonMaxY: 4.2, // clamps how high the dragon will climb to follow the bird (stays under the ceiling)

  // --- Dragon attacks (Phase 5.3/5.4) ---
  // All four patterns from docs/phase5-encounters.md's "Attack System"
  // section now exist. Per-encounter difficulty scaling (gating which
  // patterns Dragon I/II/III can pick, faster rate/speed) is Phase 5.6 -
  // these are the baseline numbers with every pattern available.
  attackCooldown: 1.8, // seconds of downtime between any two attacks, regardless of which pattern just finished ("Only one pattern is active at a time")
  projectileDespawnPadding: 2, // world units beyond the play area's x/y bounds before a stray projectile is recycled

  fireballInterval: 1.5, // kept for reference by AttackController's initial-shot timing; actual pacing between attacks now comes from attackCooldown
  fireballSpeed: 5, // world units/sec, aimed at the bird's position at fire time

  // Fire Breath (Phase 5.4) - a wall with a fixed gap, gap aimed at the
  // bird's height when it's cast (see AttackController._fireFireBreath).
  fireBreathWarnDuration: 0.5, // seconds the dragon "charges" before the wall actually launches
  fireBreathSpeed: 2.6, // slower than a fireball - it's a wall to dodge, not a shot to react to
  fireBreathGapHeight: 2.1, // vertical opening the bird must fly through
  fireBreathThickness: 1.4, // solid chunk height above/below the gap
  fireBreathActiveDuration: 3.2, // seconds AttackController waits (wall in flight) before moving on - roughly onScreenX to past the bird at fireBreathSpeed

  // Dive Attack (Phase 5.4) - the dragon itself becomes the hazard: it
  // retreats off-screen, locks onto the bird's height, then charges
  // straight across at high speed (docs/phase5-encounters.md's "Dive
  // Attack" section).
  diveWindupDuration: 0.6, // seconds retreating off-screen before the charge
  diveChargeSpeed: 11, // world units/sec while charging across
  diveReturnDuration: 0.8, // seconds easing back onto its resting mark after the charge
  diveHitRadius: 0.65, // roughly the dragon's body size, used for the charge's own hit-test (it isn't a pooled projectile)

  // Tail Swipe (Phase 5.4) - one large, slow hitbox whose vertical
  // center sweeps across the play area as it crosses the screen.
  tailSwipeSpeed: 1.6, // slow - "Slow animation. Easy to understand."
  tailSwipeThickness: 1.3, // vertical size of the sweeping hitbox - deliberately big
  tailSwipeSweepRange: 3, // vertical distance the hitbox's center travels during the sweep
  tailSwipeSweepDuration: 2.2, // seconds to complete the sweep (independent of horizontal speed)
  tailSwipeActiveDuration: 5.2, // seconds AttackController waits before moving on - enough for the bar to cross from onScreenX past the bird at tailSwipeSpeed

  // --- Storm encounter (Phase 5.6) ---
  // No boss entity - the weather itself is the encounter (docs/storm.md).
  // StormController owns CloudSystem/WindSystem/LightningSystem; these are
  // its tuning knobs, grouped the same way as the Dragon config above.
  stormSurviveDuration: 20, // seconds - the ACTIVE-phase survival window (BaseEncounter's `duration`)
  stormIntroDuration: 2.5, // seconds for clouds/fog to roll in, played as BaseEncounter's INTRO phase
  stormOutroDuration: 2.0, // seconds for clouds/fog to clear, played as BaseEncounter's OUTRO phase

  // Clouds (CloudSystem) - purely decorative
  stormCloudCount: 6,
  stormCloudOpacity: 0.24,
  stormCloudMinScale: 1.2,
  stormCloudMaxScale: 2.4,
  stormCloudSpread: 12,
  stormCloudDepth: -3,
  stormCloudDrift: 0.8,
  stormCloudResetX: 14,
  stormFogDarken: 2.2,

  // Wind zones (WindSystem) - temporarily override the bird's gravity, never its velocity directly
  stormWindZoneCount: 3,
  stormWindZoneWidth: 2.8,
  stormWindZoneSpeed: 3.5,
  stormWindInfluenceScale: 0.85,
  stormUpdraftForce: -20,
  stormDowndraftForce: 24,

  // Lightning (LightningSystem) - IDLE -> WARNING -> STRIKE, always telegraphed before it can hit
  stormLightningInterval: 3.5, // seconds spent in IDLE before the next warning begins
  stormLightningWarnTime: 1.0, // seconds the warning indicator shows before the strike lands
  stormLightningStrikeDelay: 0.8, // reserved for a future thunder-after-flash audio delay (docs/storm.md's "Audio" section)
  stormLightningSpread: 5, // world units either side of the bird's x the strike can land
  stormLightningWidth: 0.9, // world units of hit-test width around the strike's x
  stormLightningLife: 0.7, // seconds the STRIKE hit-test window stays live before returning to IDLE
  stormLightningShake: 0.65, // camera shake amount on strike
  stormLightningKnockbackVelocity: -28, // reserved for a future on-hit knockback effect
};

export const INPUT_KEYS = Object.freeze({
  FLAP: [' ', 'Space', 'ArrowUp'],
  PAUSE: ['p', 'P', 'Escape'],
});
