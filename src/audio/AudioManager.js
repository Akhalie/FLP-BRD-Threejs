import { CONFIG } from '../utils/Constants.js';

/**
 * Every sound in the game is synthesized on the fly with the Web
 * Audio API - there are no .mp3/.wav assets to load. This keeps the
 * game fully playable before an art/audio pipeline exists, and the
 * retro chiptune-ish tone actually fits the PS1/N64 art direction.
 *
 * Browsers require a user gesture before audio can play, so the
 * AudioContext is created lazily and `resume()` should be called from
 * the first real user interaction (Game already does this from the
 * 'flap'/'pause' input events).
 */
export class AudioManager {
  // G4 B4 D5 B4 - simple, cheerful loop for normal gameplay.
  static NORMAL_PATTERN = [392, 494, 587, 494];
  static NORMAL_STEP_SECONDS = 0.28;
  // G3 A#3 A3 C4 - lower and a touch faster: ominous instead of cheerful, and more urgent.
  static BOSS_PATTERN = [196, 233, 220, 261];
  static BOSS_STEP_SECONDS = 0.22;

  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this._musicTimer = null;
    this._musicStep = 0;
    this._musicPattern = AudioManager.NORMAL_PATTERN;
    this._musicStepSeconds = AudioManager.NORMAL_STEP_SECONDS;
    this._crossfadeTimer = null;
    this.muted = false;
  }

  /** Creates the AudioContext on first use. Safe to call more than once. */
  _ensureContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = CONFIG.musicVolume;
    this.musicGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = CONFIG.sfxVolume;
    this.sfxGain.connect(this.master);
  }

  /** Call from a user-gesture event handler (click/keydown) to unlock audio. */
  resume() {
    this._ensureContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 1;
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // --- One-shot SFX ----------------------------------------------------

  /** Quick upward blip for the flap/jump. */
  playFlap() {
    this._ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.08);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.9, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

    osc.connect(gain).connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  /** Bright two-note chime when a point is scored. */
  playPoint() {
    this._ensureContext();
    const t = this.ctx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const start = t + i * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.7, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);

      osc.connect(gain).connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.14);
    });
  }

  /** Bright three-note ascending "ding" for collecting a coin - quicker and higher-pitched than playPoint(). */
  playCoin() {
    this._ensureContext();
    const t = this.ctx.currentTime;
    [1046, 1318, 1568].forEach((freq, i) => {
      const start = t + i * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.5, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);

      osc.connect(gain).connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.1);
    });
  }

  /** Short noise burst for a pipe/ground hit. */
  playHit() {
    this._ensureContext();
    const t = this.ctx.currentTime;

    const noise = this._createNoiseSource(0.2);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

    noise.connect(filter).connect(gain).connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.2);
  }

  /** Descending "womp" for death, meant to follow shortly after playHit(). */
  playDie() {
    this._ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.5);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

    osc.connect(gain).connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  /** Soft click for menu/UI buttons. */
  playUiClick() {
    this._ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    osc.connect(gain).connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /** Rising four-note fanfare played once when an encounter (boss fight) is survived - bigger and slower than playPoint()/playCoin() so a win reads as a bigger deal. */
  playVictory() {
    this._ensureContext();
    const t = this.ctx.currentTime;
    [523, 659, 784, 1046].forEach((freq, i) => {
      const start = t + i * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.8, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);

      osc.connect(gain).connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  }

  // --- Background music -------------------------------------------------

  /** Starts a tiny looping arpeggio. Idempotent - calling twice doesn't stack loops. */
  startMusic() {
    this._ensureContext();
    if (this._musicTimer !== null) return;

    this._musicPattern = AudioManager.NORMAL_PATTERN;
    this._musicStepSeconds = AudioManager.NORMAL_STEP_SECONDS;
    this._startMusicLoop();
  }

  stopMusic() {
    clearTimeout(this._crossfadeTimer);
    this._crossfadeTimer = null;
    if (this._musicTimer !== null) {
      clearInterval(this._musicTimer);
      this._musicTimer = null;
    }
  }

  /**
   * Swaps the running loop to the lower, more ominous boss pattern
   * (docs/phase5-encounters.md's "Audio" section: "Transition using
   * crossfade"). Fades the current loop out, swaps the pattern/tempo,
   * then fades the new one back in - a true simultaneous crossfade
   * would need a second oscillator chain running in parallel, which is
   * overkill for a two-note-chord chiptune loop like this one.
   *
   * No-op if music isn't currently running (e.g. paused) or the boss
   * pattern is already playing, so BaseEncounter can call this
   * unconditionally from every encounter's start() without checking
   * game state itself.
   */
  crossfadeToBoss() {
    this._crossfadeTo(AudioManager.BOSS_PATTERN, AudioManager.BOSS_STEP_SECONDS);
  }

  /** Mirror of crossfadeToBoss() - eases back to the normal loop. Called from every encounter's cleanup(). */
  crossfadeToNormal() {
    this._crossfadeTo(AudioManager.NORMAL_PATTERN, AudioManager.NORMAL_STEP_SECONDS);
  }

  _startMusicLoop() {
    const playStep = () => {
      const pattern = this._musicPattern;
      const stepSeconds = this._musicStepSeconds;
      const freq = pattern[this._musicStep % pattern.length];
      this._musicStep += 1;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + stepSeconds * 0.9);

      osc.connect(gain).connect(this.musicGain);
      osc.start(t);
      osc.stop(t + stepSeconds);
    };

    playStep();
    this._musicTimer = setInterval(playStep, this._musicStepSeconds * 1000);
  }

  _crossfadeTo(pattern, stepSeconds) {
    if (this._musicTimer === null || this._musicPattern === pattern) return;
    this._ensureContext();

    const half = CONFIG.encounterMusicCrossfade / 2;
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(0.0001, now + half);

    clearTimeout(this._crossfadeTimer);
    this._crossfadeTimer = setTimeout(() => {
      clearInterval(this._musicTimer);
      this._musicPattern = pattern;
      this._musicStepSeconds = stepSeconds;
      this._musicStep = 0;
      this._startMusicLoop();

      const resumeAt = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(resumeAt);
      this.musicGain.gain.setValueAtTime(0.0001, resumeAt);
      this.musicGain.gain.linearRampToValueAtTime(CONFIG.musicVolume, resumeAt + half);
    }, half * 1000);
  }

  _createNoiseSource(durationSeconds) {
    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, sampleRate * durationSeconds, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }
}
