import { Pipe } from '../entities/Pipe.js';
import { Coin } from '../entities/Coin.js';
import { ObjectPool } from './ObjectPool.js';
import { CONFIG } from '../utils/Constants.js';

/**
 * Owns a pool of Pipe entities (and a matching pool of Coin entities,
 * one per pipe pair) and drives spawning/movement/recycling for both.
 * Nothing outside this class should mutate `.active` directly - use
 * reset()/update() and read `.active` / `.activeCoins` to iterate the
 * current pipes and coins.
 */
export class PipeSpawner {
  constructor(scene) {
    this.scene = scene;
    this.active = [];
    this.activeCoins = [];
    this.speed = CONFIG.pipeSpeed;
    this._timer = 0;

    this.pool = new ObjectPool(
      () => new Pipe(),
      (pipe) => {
        pipe.active = false;
        this.scene.remove(pipe.group);
      },
      6 // pre-warm enough pairs that we never allocate mid-game
    );

    this.coinPool = new ObjectPool(
      () => new Coin(),
      (coin) => {
        coin.active = false;
        this.scene.remove(coin.mesh);
      },
      6 // one coin per pre-warmed pipe pair
    );
  }

  reset() {
    // Return every currently active pipe/coin to their pools before clearing.
    for (const pipe of this.active) {
      this.pool.release(pipe);
    }
    for (const coin of this.activeCoins) {
      this.coinPool.release(coin);
    }
    this.active = [];
    this.activeCoins = [];
    this.speed = CONFIG.pipeSpeed;
    this._timer = 0;
  }

  update(delta) {
    this._timer += delta;
    if (this._timer >= CONFIG.pipeSpawnInterval) {
      this._timer = 0;
      this._spawnPipe();
    }

    for (let i = this.active.length - 1; i >= 0; i--) {
      const pipe = this.active[i];
      pipe.update(delta, this.speed);

      if (pipe.getX() < CONFIG.pipeDespawnX) {
        this.active.splice(i, 1);
        this.pool.release(pipe);
      }
    }

    // Coins travel and despawn independently of their pipe (a coin
    // collected mid-screen still needs to keep moving/despawn cleanly),
    // but they're always spawned in lockstep with a pipe in _spawnPipe().
    for (let i = this.activeCoins.length - 1; i >= 0; i--) {
      const coin = this.activeCoins[i];
      coin.update(delta, this.speed);

      if (coin.getX() < CONFIG.pipeDespawnX) {
        this.activeCoins.splice(i, 1);
        this.coinPool.release(coin);
      }
    }
  }

  increaseDifficulty({ speedIncrease = 0 } = {}) {
    this.speed += speedIncrease;
  }

  _spawnPipe() {
    const pipe = this.pool.acquire();
    pipe.spawn(CONFIG.pipeSpawnX);
    this.scene.add(pipe.group);
    this.active.push(pipe);

    // One coin per pipe pair, floating in the middle of its gap - the
    // safest, most natural spot to fly through while chasing it.
    const coin = this.coinPool.acquire();
    coin.spawn(CONFIG.pipeSpawnX, pipe.getGapCenterY());
    this.scene.add(coin.mesh);
    this.activeCoins.push(coin);
  }
}
