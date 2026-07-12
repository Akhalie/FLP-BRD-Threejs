import { CONFIG } from '../utils/Constants.js';

const BIRD_HALF_HEIGHT = 0.25; // matches Bird's 0.5-unit body cube

/**
 * Pure collision checks - no side effects, no knowledge of game state.
 * Game.js decides what happens (death, transitions) based on the
 * booleans this returns.
 */
export class CollisionSystem {
  checkGround(bird) {
    return bird.getPosition().y - BIRD_HALF_HEIGHT <= CONFIG.groundY;
  }

  checkCeiling(bird) {
    return bird.getPosition().y + BIRD_HALF_HEIGHT >= CONFIG.ceilingY;
  }

  checkPipes(bird, pipes) {
    for (const pipe of pipes) {
      if (!pipe.active) continue;
      if (bird.box.intersectsBox(pipe.topBox) || bird.box.intersectsBox(pipe.bottomBox)) {
        return true;
      }
    }
    return false;
  }

  /** Returns every not-yet-collected coin the bird is currently overlapping (usually 0 or 1 per frame). */
  checkCoins(bird, coins) {
    const collected = [];
    for (const coin of coins) {
      if (coin.active && !coin.collected && bird.box.intersectsBox(coin.box)) {
        collected.push(coin);
      }
    }
    return collected;
  }
}