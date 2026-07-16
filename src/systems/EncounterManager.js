import { CONFIG } from '../utils/Constants.js';
import { BaseEncounter } from '../encounters/BaseEncounter.js';
import { DragonEncounter } from '../encounters/DragonEncounter.js';

/**
 * Registry of concrete encounter classes by type name (matches the
 * `type` field in CONFIG.encounterCheckpoints). Types without a real
 * entry here (storm, ufo, volcano - reserved for future phases) fall
 * back to BaseEncounter, which just silently survives its duration
 * and hands control back - this keeps every checkpoint playable (and
 * this manager fully testable) even before every encounter exists.
 */
const ENCOUNTER_REGISTRY = {
  dragon: DragonEncounter, // Phase 5.2 - entity, idle animation, intro/outro fly-in/out
};

/**
 * Internal-only phase, distinct from GameState.ENCOUNTER (which Game.js
 * uses and covers this entire span). The Game class never reads this -
 * see BaseEncounter.js's doc comment for why that separation exists.
 */
export const EncounterManagerPhase = Object.freeze({
  IDLE: 'IDLE',
  WARNING: 'WARNING',
  ENCOUNTER: 'ENCOUNTER',
});

/**
 * Watches the score for the next checkpoint (CONFIG.encounterCheckpoints,
 * consumed in order, never repeating) and owns the currently active
 * encounter instance. Game.js only ever calls checkCheckpoint() /
 * update() / render() / reset() and reads `.isActive` / `.timeRemaining`
 * - it never needs to know which encounter type is running or import
 * any concrete encounter class (see docs/phase5-encounters.md).
 */
export class EncounterManager {
  /**
   * @param {object} context - shared references passed straight through
   *   to whatever encounter gets constructed (scene, bird, cameraManager,
   *   audioManager, particleSystem, pipeSpawner, emitter, ...).
   */
  constructor(context) {
    this.context = context;
    this.emitter = context.emitter;

    this._checkpoints = CONFIG.encounterCheckpoints;
    this._nextCheckpointIndex = 0;

    this.phase = EncounterManagerPhase.IDLE;
    this._warningElapsed = 0;
    this._pendingType = null;
    this.current = null;
  }

  /** True from the moment a checkpoint is crossed until the encounter (incl. outro) fully finishes. */
  get isActive() {
    return this.phase !== EncounterManagerPhase.IDLE;
  }

  /** Seconds left in the active encounter's survival timer - 0 when idle/warning. For HUD display. */
  get timeRemaining() {
    return this.current ? this.current.timeRemaining : 0;
  }

  /** Back to a fresh run: next checkpoint is the first one again. Call from Game's restart/returnToMenu. */
  reset() {
    if (this.current) this.current.cleanup();
    this.current = null;
    this._nextCheckpointIndex = 0;
    this.phase = EncounterManagerPhase.IDLE;
    this._warningElapsed = 0;
    this._pendingType = null;
  }

  /**
   * Call once per frame from PLAYING (before any encounter is active).
   * Returns true the instant `score` crosses the next checkpoint, which
   * is Game.js's cue to switch to GameState.ENCOUNTER.
   */
  checkCheckpoint(score) {
    if (this.isActive) return false;

    const next = this._checkpoints[this._nextCheckpointIndex];
    if (!next || score < next.score) return false;

    this._nextCheckpointIndex += 1;
    this._beginWarning(next.type);
    return true;
  }

  /** Call once per frame from GameState.ENCOUNTER. */
  update(delta) {
    switch (this.phase) {
      case EncounterManagerPhase.WARNING:
        this._warningElapsed += delta;
        if (this._warningElapsed >= CONFIG.encounterWarningDuration) {
          this._launchEncounter();
        }
        break;
      case EncounterManagerPhase.ENCOUNTER:
        this.current.update(delta);
        if (this.current.isFinished) this._finishEncounter();
        break;
      default:
        break; // IDLE - nothing to do
    }
  }

  /** Call once per frame from GameState.ENCOUNTER, alongside update(). */
  render() {
    if (this.phase === EncounterManagerPhase.ENCOUNTER) this.current.render();
  }

  /** Call once per frame from GameState.ENCOUNTER, alongside update()/render(). See BaseEncounter.checkHit(). */
  checkHit(bird) {
    return this.phase === EncounterManagerPhase.ENCOUNTER ? this.current.checkHit(bird) : false;
  }

  _beginWarning(type) {
    this.phase = EncounterManagerPhase.WARNING;
    this._warningElapsed = 0;
    this._pendingType = type;
    // UI/audio/camera transition hooks (WARNING flash, music duck, etc.)
    // subscribe to this - the manager itself stays presentation-agnostic.
    this.emitter.emit('encounterWarning', type);
  }

  _launchEncounter() {
    const EncounterClass = ENCOUNTER_REGISTRY[this._pendingType] || BaseEncounter;
    this.current = new EncounterClass(this.context);
    this.current.type = this._pendingType;
    this.phase = EncounterManagerPhase.ENCOUNTER;
    this.current.start();
    this.emitter.emit('encounterStart', this.current.type);
  }

  _finishEncounter() {
    this.current.stop();
    this.current.cleanup();
    const finishedType = this.current.type;
    this.current = null;
    this._pendingType = null;
    this.phase = EncounterManagerPhase.IDLE;
    this.emitter.emit('encounterEnd', finishedType);
  }
}
