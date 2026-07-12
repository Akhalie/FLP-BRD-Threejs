const BEST_SCORE_KEY = 'flappy3d.bestScore';

/**
 * Tracks the current run's score plus the all-time best (persisted in
 * localStorage so it survives page reloads). Emits 'score' on every
 * change (reset included) so the HUD can just listen rather than poll,
 * and a distinct 'pointScored' event only when a real point is earned
 * (never on reset) so Game.js can play a sound exactly on scoring.
 */
export class ScoreSystem {
  constructor(emitter) {
    this.emitter = emitter;
    this.score = 0;
    this.best = this._loadBest();
  }

  reset() {
    this.score = 0;
    this.emitter.emit('score', this.score);
  }

  addPoint() {
    this.score += 1;
    if (this.score > this.best) {
      this.best = this.score;
      this._saveBest(this.best);
    }
    this.emitter.emit('score', this.score);
    this.emitter.emit('pointScored', this.score);
  }

  _loadBest() {
    try {
      return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
    } catch {
      return 0; // localStorage unavailable (e.g. privacy mode) - just don't persist
    }
  }

  _saveBest(value) {
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(value));
    } catch {
      // ignore - best score just won't persist this session
    }
  }

  /** Awards a point the first time the bird's x position passes each active pipe. */
  checkPipePassed(bird, pipes) {
    const birdX = bird.getPosition().x;

    for (const pipe of pipes) {
      if (pipe.active && !pipe.passed && pipe.getX() < birdX) {
        pipe.passed = true;
        this.addPoint();
      }
    }
  }
}
