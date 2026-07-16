import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { CameraManager } from './CameraManager.js';
import { RendererManager } from './RendererManager.js';
import { InputManager } from './InputManager.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { GameState, CONFIG } from '../utils/Constants.js';
import { Bird } from '../entities/Bird.js';
import { Ground } from '../entities/Ground.js';
import { PipeSpawner } from '../systems/PipeSpawner.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { CoinSystem } from '../systems/CoinSystem.js';
import { ShopSystem } from '../systems/ShopSystem.js';
import { EncounterManager } from '../systems/EncounterManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import { UIManager } from '../ui/UIManager.js';

const GROUND_REST_Y = CONFIG.groundY + 0.25; // bird's half-height, so it visually sits on the ground

/**
 * Top-level orchestrator and the game's state machine.
 *
 * Phase 3: real UI (menu/HUD/pause/game-over), synthesized audio,
 * camera shake, and particles, layered on top of the Phase 2 state
 * machine (MENU -> READY -> PLAYING -> GAME_OVER, with PAUSED
 * reachable from PLAYING).
 *
 * Phase 4: PerformanceMonitor runs every frame and adapts render
 * resolution to keep frame rate playable on slower/mobile devices,
 * and the game auto-pauses if the tab/app is backgrounded mid-run.
 *
 * The UI depends on Game (via events + public methods below), but
 * Game never imports UI internals beyond constructing UIManager here
 * - that one-way dependency keeps the state machine testable without
 * a DOM.
 *
 * State transition rules live entirely in `_handleFlap()` /
 * `_handlePause()` / the public start/restart/menu methods, so anyone
 * reading this file top-to-bottom can see the full flow without
 * hunting through entity or UI code.
 */
export class Game {
  constructor(canvas, uiRoot) {
    this.emitter = new EventEmitter();

    this.sceneManager = new SceneManager();
    this.rendererManager = new RendererManager(canvas);
    this.cameraManager = new CameraManager(this.rendererManager.getAspect());
    this.inputManager = new InputManager(this.emitter);

    this.bird = new Bird();
    this.sceneManager.scene.add(this.bird.group);

    this.ground = new Ground(this.sceneManager.scene);
    this.pipeSpawner = new PipeSpawner(this.sceneManager.scene);
    this.collisionSystem = new CollisionSystem();
    this.scoreSystem = new ScoreSystem(this.emitter);
    this.coinSystem = new CoinSystem(this.emitter);

    this.shopSystem = new ShopSystem(
    this.coinSystem,
    this.emitter
  );

    this.bird.setBodyColor(this.shopSystem.getEquippedColor());
    this.emitter.on('skinEquipped', (color) => {this.bird.setBodyColor(color);});
    

    this.audioManager = new AudioManager();
    this.particleSystem = new ParticleSystem(this.sceneManager.scene);
    this.performanceMonitor = new PerformanceMonitor(this.rendererManager);

    // Encounters (Phase 5): temporary interruptions of normal pipe
    // gameplay, triggered at score checkpoints. See EncounterManager.js
    // and docs/phase5-encounters.md for the full design.
    this.encounterManager = new EncounterManager({
      scene: this.sceneManager.scene,
      bird: this.bird,
      cameraManager: this.cameraManager,
      audioManager: this.audioManager,
      particleSystem: this.particleSystem,
      pipeSpawner: this.pipeSpawner,
      emitter: this.emitter,
    });

    this.clock = new THREE.Clock();
    this.state = GameState.MENU;
    this._prePauseState = GameState.PLAYING;
    this._pendingLandingPuff = false;

    this._rafId = null;
    this._boundLoop = this._loop.bind(this);
    this._boundResize = this._onResize.bind(this);
    this._boundVisibilityChange = this._onVisibilityChange.bind(this);

    this.emitter.on('flap', () => this._handleFlap());
    this.emitter.on('pause', () => this._handlePause());
    this.emitter.on('pointScored', () => this.audioManager.playPoint());

    // Encounter transition feel (Phase 5.1): the WARNING flash gets a
    // camera punch and darkening fog; both undo themselves once the
    // whole encounter (outro included) finishes. Concrete encounters
    // are free to layer their own effects on top of this.
    this.emitter.on('encounterWarning', () => {
      this.cameraManager.shake(CONFIG.cameraShakeTraumaOnEncounterWarning);
      this.sceneManager.darkenFog();
    });
    this.emitter.on('encounterEnd', () => this.sceneManager.restoreFog());

    // Any raw input also doubles as the user gesture that unlocks audio.
    this.emitter.on('flap', () => this.audioManager.resume());
    this.emitter.on('pause', () => this.audioManager.resume());

    // UIManager is constructed last so every system it might reference
    // (scoreSystem, audioManager, emitter) already exists.
    this.uiManager = new UIManager(uiRoot, this);
  }

  start() {
    window.addEventListener('resize', this._boundResize);
    document.addEventListener('visibilitychange', this._boundVisibilityChange);
    this.clock.start();
    this._loop();
  }

  stop() {
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    window.removeEventListener('resize', this._boundResize);
    document.removeEventListener('visibilitychange', this._boundVisibilityChange);
  }

  dispose() {
    this.stop();
    this.audioManager.stopMusic();
    this.inputManager.dispose();
    this.rendererManager.dispose();
  }

  // --- State machine -----------------------------------------------------

  _handleFlap() {
    switch (this.state) {
      case GameState.READY:
        this._startPlaying();
        break;
      case GameState.PLAYING:
      case GameState.ENCOUNTER:
        this.bird.jump();
        this.audioManager.playFlap();
        break;
      case GameState.GAME_OVER:
        this._restart();
        break;
      default:
        break; // MENU (Play button handles it) / PAUSED ignore flap
    }
  }

  _handlePause() {
    if (this.state === GameState.PLAYING || this.state === GameState.ENCOUNTER) {
      this._prePauseState = this.state;
      this.state = GameState.PAUSED;
      this.audioManager.stopMusic();
      this.emitter.emit('stateChange', this.state);
    } else if (this.state === GameState.PAUSED) {
      this.state = this._prePauseState;
      this.audioManager.startMusic();
      this.emitter.emit('stateChange', this.state);
    }
  }

  /** Called by MainMenu's Play button. MENU -> READY (flap then starts the run, same as Phase 2). */
  startGame() {
    if (this.state !== GameState.MENU) return;
    this.bird.reset();
    this.state = GameState.READY;
    this.emitter.emit('stateChange', this.state);
  }

  /** Called by GameOverScreen's Play Again button. Identical to flapping to retry from GAME_OVER. */
  requestRestart() {
    if (this.state !== GameState.GAME_OVER) return;
    this._restart();
  }

  /** Called by PauseOverlay/GameOverScreen's Main Menu button. Resets everything and goes to MENU. */
  returnToMenu() {
    this.bird.reset();
    this.pipeSpawner.reset();
    this.scoreSystem.reset();
    this.coinSystem.reset();
    this.encounterManager.reset();
    this.sceneManager.restoreFog();
    this.audioManager.stopMusic();
    this.state = GameState.MENU;
    this.emitter.emit('stateChange', this.state);
  }

  _startPlaying() {
    this.state = GameState.PLAYING;
    this.bird.jump();
    this.audioManager.playFlap();
    this.audioManager.startMusic();
    this.emitter.emit('stateChange', this.state);
  }

  _restart() {
    this.bird.reset();
    this.pipeSpawner.reset();
    this.scoreSystem.reset();
    this.coinSystem.reset();
    this.encounterManager.reset();
    this.sceneManager.restoreFog();
    this.state = GameState.READY;
    this.emitter.emit('stateChange', this.state);
  }

  _onDeath(hitGround) {
    this.bird.die();
    this.audioManager.stopMusic();
    this.audioManager.playHit();
    this.audioManager.playDie();
    this.cameraManager.shake(CONFIG.cameraShakeTraumaOnDeath);
    this.particleSystem.burstFeathers(this.bird.getPosition());

    if (hitGround) {
      this.bird.group.position.y = GROUND_REST_Y;
      this.bird.velocity = 0;
      this.particleSystem.burstDust(this.bird.getPosition());
      this._pendingLandingPuff = false;
    } else {
      // Died mid-air (pipe hit) - the dust puff fires later, once the
      // bird actually reaches the ground in _updateGameOver().
      this._pendingLandingPuff = true;
    }

    this.state = GameState.GAME_OVER;
    this.emitter.emit('gameOver', this.scoreSystem.score);
    this.emitter.emit('stateChange', this.state);
  }

  // --- Loop ----------------------------------------------------------------

  _loop() {
    this._rafId = requestAnimationFrame(this._boundLoop);
    const delta = Math.min(this.clock.getDelta(), 0.1); // clamp to avoid huge jumps on tab-switch
    this._update(delta);
    this._render();
  }

  _update(delta) {
    this.performanceMonitor.update(delta);
    this.cameraManager.update(delta);
    this.particleSystem.update(delta);

    switch (this.state) {
      case GameState.MENU:
        this.bird.hover(delta);
        this.ground.update(delta, CONFIG.menuGroundSpeed);
        break;
      case GameState.READY:
        this.bird.hover(delta);
        this.ground.update(delta, CONFIG.pipeSpeed);
        break;
      case GameState.PLAYING:
        this._updatePlaying(delta);
        break;
      case GameState.ENCOUNTER:
        this._updateEncounter(delta);
        break;
      case GameState.GAME_OVER:
        this._updateGameOver(delta);
        break;
      case GameState.PAUSED:
      default:
        break; // frozen
    }
  }

  _updatePlaying(delta) {
    this.bird.update(delta);
    this.ground.update(delta, this.pipeSpawner.speed);
    this.pipeSpawner.update(delta);
    this.scoreSystem.checkPipePassed(this.bird, this.pipeSpawner.active);
    this._collectCoins();

    const hitPipe = this.collisionSystem.checkPipes(
      this.bird,
      this.pipeSpawner.active
    );

    const hitGround = this.collisionSystem.checkGround(this.bird);

    const hitCeiling = this.collisionSystem.checkCeiling(this.bird);

    if (hitPipe || hitGround || hitCeiling) {
      this._onDeath(hitGround);
      return;
    }

    if (this.encounterManager.checkCheckpoint(this.scoreSystem.score)) {
      this._beginEncounter();
    }
  }

  /**
   * PLAYING -> ENCOUNTER. Fired the instant checkCheckpoint() crosses a
   * checkpoint (still inside the WARNING flash - see EncounterManager).
   * New pipes stop spawning immediately; whatever's already on screen
   * keeps moving/despawning normally so it naturally clears itself.
   */
  _beginEncounter() {
    this.pipeSpawner.pauseSpawning();
    this.state = GameState.ENCOUNTER;
    this.emitter.emit('stateChange', this.state);
  }

  /** ENCOUNTER -> PLAYING, once EncounterManager reports it's fully done (outro included). */
  _endEncounter() {
    this.pipeSpawner.resumeSpawning();
    this.state = GameState.PLAYING;
    this.emitter.emit('stateChange', this.state);
  }

  /**
   * Runs while GameState.ENCOUNTER owns gameplay. The bird still flies
   * and can still die (ground/ceiling/any leftover pipe), the ground
   * keeps scrolling, and whatever pipes/coins were already on screen
   * keep moving until they clear - but no *new* pipes/coins spawn, and
   * score no longer increases. EncounterManager drives the actual
   * encounter (warning -> active -> outro) underneath all of this.
   */
  _updateEncounter(delta) {
    this.bird.update(delta);
    this.ground.update(delta, this.pipeSpawner.speed);
    this.pipeSpawner.update(delta);
    this._collectCoins();

    this.encounterManager.update(delta);
    this.encounterManager.render();

    const hitPipe = this.collisionSystem.checkPipes(this.bird, this.pipeSpawner.active);
    const hitGround = this.collisionSystem.checkGround(this.bird);
    const hitCeiling = this.collisionSystem.checkCeiling(this.bird);
    const hitEncounterHazard = this.encounterManager.checkHit(this.bird); // e.g. a dragon fireball (Phase 5.3)

    if (hitPipe || hitGround || hitCeiling || hitEncounterHazard) {
      this._onDeath(hitGround);
      return;
    }

    if (!this.encounterManager.isActive) {
      this._endEncounter();
    }
  }

  /** Checks the bird against every coin currently in flight and claims any it's touching. */
  _collectCoins() {
    const collected = this.collisionSystem.checkCoins(this.bird, this.pipeSpawner.activeCoins);
    for (const coin of collected) {
      coin.collect();
      this.coinSystem.addCoin(CONFIG.coinValue);
      this.audioManager.playCoin();
      this.particleSystem.burstCoinSparkle(this.bird.getPosition());
    }
  }

  _updateGameOver(delta) {
    // Let the bird keep falling under gravity until it rests on the ground.
    // Pipes intentionally freeze (no pipeSpawner.update call) on death.
    if (this.bird.getPosition().y > GROUND_REST_Y) {
      this.bird.update(delta);
      if (this.bird.getPosition().y <= GROUND_REST_Y) {
        this.bird.group.position.y = GROUND_REST_Y;
        this.bird.velocity = 0;
        if (this._pendingLandingPuff) {
          this.particleSystem.burstDust(this.bird.getPosition());
          this._pendingLandingPuff = false;
        }
      }
    }
  }

  _render() {
    this.rendererManager.render(this.sceneManager.scene, this.cameraManager.camera);
  }

  _onResize() {
    this.rendererManager.onResize();
    this.cameraManager.onResize(this.rendererManager.getAspect());
  }

  /** Auto-pauses an in-progress run when the tab/app is backgrounded (switching apps on mobile, alt-tab on desktop). */
  _onVisibilityChange() {
    if (document.hidden && (this.state === GameState.PLAYING || this.state === GameState.ENCOUNTER)) {
      this._handlePause();
    }
  }
}