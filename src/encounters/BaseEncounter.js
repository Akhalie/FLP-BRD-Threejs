/**
 * Base class every Encounter (Dragon, Storm, UFO, ...) inherits from.
 *
 * Encounters are temporary interruptions of the normal pipe gameplay
 * (see docs/phase5-encounters.md). Every encounter shares the same
 * external lifecycle, so EncounterManager only ever talks to this
 * contract - it never needs to import or know about a concrete
 * encounter class.
 *
 * Lifecycle (driven entirely by EncounterManager, one call each):
 *   start()        - once, right as the WARNING flash ends
 *   update(delta)  - every frame while the encounter owns gameplay
 *   render()       - every frame, for encounters that sync three.js
 *                    objects outside of update() (kept separate so a
 *                    future fixed-timestep update loop doesn't have to
 *                    also fix the render step)
 *   stop()         - once, right as the encounter's own outro finishes
 *   cleanup()      - once, always - even if aborted early (e.g. the
 *                    bird dies mid-encounter) - so scene objects never
 *                    leak
 *
 * Plus one optional per-frame query, called alongside update()/render()
 * (Phase 5.3+):
 *
 *   checkHit(bird) - true if the encounter's own hazards (e.g. a
 *                    dragon fireball) just hit the bird. Game.js
 *                    treats a true return exactly like a pipe hit
 *                    (instant death) - see EncounterManager.checkHit().
 *                    Default: false, since a bare survival timer has
 *                    no hazards of its own.
 *
 * Internal phases (own to BaseEncounter, distinct from GameState /
 * EncounterManager's phase):
 *
 *   INTRO -> ACTIVE -> OUTRO -> DONE
 *
 * Subclasses generally only need to, in their constructor, set
 * `this.duration` (survival time in seconds) and optionally
 * `this.introDuration` / `this.outroDuration`, then override whichever
 * `_on*` hooks they need below.
 *
 * The base class with no overrides is still a *valid* encounter: it
 * silently survives `duration` seconds and then finishes. That keeps
 * the EncounterManager/transition plumbing testable before any
 * concrete encounter exists.
 */

export const EncounterPhase = Object.freeze({
  INTRO: 'INTRO',
  ACTIVE: 'ACTIVE',
  OUTRO: 'OUTRO',
  DONE: 'DONE',
});

export class BaseEncounter {
  /**
   * @param {object} context - shared systems/references an encounter
   *   might need (scene, bird, cameraManager, audioManager,
   *   particleSystem, emitter, ...). Concrete encounters read whatever
   *   they need from here; the base class just stores the reference.
   */
  constructor(context) {
    this.context = context;

    // Set by EncounterManager right after construction; useful for
    // subclasses/logging, not used by the base lifecycle itself.
    this.type = 'base';

    this.duration = 15; // seconds - the "Encounter Timer" / survival window
    this.introDuration = 0; // subclasses with an intro animation set this
    this.outroDuration = 0; // subclasses with an outro animation set this

    this.phase = EncounterPhase.INTRO;
    this._phaseElapsed = 0;
    this._survivedElapsed = 0;
  }

  /** Seconds left in the survival timer - for HUD display. Never negative. */
  get timeRemaining() {
    return Math.max(0, Math.ceil(this.duration - this._survivedElapsed));
  }

  /** True once OUTRO (or ACTIVE, if there's no outro) has fully played out. */
  get isFinished() {
    return this.phase === EncounterPhase.DONE;
  }

  // --- Lifecycle (called by EncounterManager) ------------------------------

  start() {
    this.phase = this.introDuration > 0 ? EncounterPhase.INTRO : EncounterPhase.ACTIVE;
    this._phaseElapsed = 0;
    this._survivedElapsed = 0;

    // Shared "this is a big deal" transition (docs/phase5-encounters.md's
    // Base Encounter "Music transition" + the Dragon Encounter's Camera
    // Effects) - every encounter gets the pull-back/tilt and boss-theme
    // crossfade for free, same reasoning as _awardRewards() below.
    this.context.cameraManager?.setEncounterMode(true);
    this.context.audioManager?.crossfadeToBoss();

    this._onStart();
    if (this.phase === EncounterPhase.ACTIVE) this._onActiveStart();
  }

  update(delta) {
    this._phaseElapsed += delta;

    switch (this.phase) {
      case EncounterPhase.INTRO:
        this._onUpdateIntro(delta);
        if (this._phaseElapsed >= this.introDuration) this._enterActive();
        break;
      case EncounterPhase.ACTIVE:
        this._survivedElapsed += delta;
        this._onUpdateActive(delta);
        if (this._survivedElapsed >= this.duration) this._enterOutro();
        break;
      case EncounterPhase.OUTRO:
        this._onUpdateOutro(delta);
        if (this._phaseElapsed >= this.outroDuration) this._enterDone();
        break;
      default:
        break; // DONE - nothing left to update
    }
  }

  render() {
    this._onRender();
  }

  /** See the class doc's "optional per-frame query" note. Default: no hazards outside the survival timer itself. */
  checkHit(_bird) {
    return false;
  }

  stop() {
    this._onStop();
  }

  cleanup() {
    // Mirror of start()'s transition-in - always runs (see cleanup()'s own
    // class-doc note: even on an aborted encounter), so the camera/music
    // never get stuck in "boss mode" if the bird dies mid-fight.
    this.context.cameraManager?.setEncounterMode(false);
    this.context.audioManager?.crossfadeToNormal();

    this._onCleanup();
  }

  // --- Phase transitions ----------------------------------------------------

  _enterActive() {
    this.phase = EncounterPhase.ACTIVE;
    this._phaseElapsed = 0;
    this._onActiveStart();
  }

  _enterOutro() {
    this._onVictory(); // subclass-specific victory cleanup (e.g. DragonEncounter clears in-flight fireballs)
    this._awardRewards(); // generic payout - see method doc; always runs, independent of the hook above
    this.phase = this.outroDuration > 0 ? EncounterPhase.OUTRO : EncounterPhase.DONE;
    this._phaseElapsed = 0;
  }

  /**
   * Generic reward payout for surviving *any* encounter
   * (docs/phase5-encounters.md's "Rewards" section: bonus score, coins,
   * a particle burst, a screen flash, and a victory sound).
   *
   * Deliberately not a `_on*` hook a subclass could forget to call -
   * every encounter gets this for free just by surviving, so it's
   * wired directly into _enterOutro() instead.
   *
   * The actual score/coin bookkeeping happens in Game.js (it owns
   * ScoreSystem/CoinSystem, not this class) - this only emits
   * 'encounterVictory' for Game.js and the HUD to react to, plus the
   * parts that *are* already in `context`: the particle burst and the
   * victory sound.
   */
  _awardRewards() {
    const { particleSystem, audioManager, bird, emitter } = this.context;

    const burstPos = bird ? bird.getPosition() : null;
    if (burstPos && particleSystem) {
      // Reuses the coin-sparkle effect, doubled up, so a boss win reads
      // as a bigger version of a familiar pickup rather than a brand
      // new effect players have to learn.
      particleSystem.burstCoinSparkle(burstPos);
      particleSystem.burstCoinSparkle(burstPos);
    }

    if (audioManager) audioManager.playVictory();
    if (emitter) emitter.emit('encounterVictory', { type: this.type });
  }

  _enterDone() {
    this.phase = EncounterPhase.DONE;
  }

  // --- Overridable hooks (no-ops by default) --------------------------------

  _onStart() {}
  _onUpdateIntro(_delta) {}
  _onActiveStart() {}
  _onUpdateActive(_delta) {}
  _onVictory() {}
  _onUpdateOutro(_delta) {}
  _onRender() {}
  _onStop() {}
  _onCleanup() {}
}
