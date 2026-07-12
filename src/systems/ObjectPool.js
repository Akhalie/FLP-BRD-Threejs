/**
 * Generic acquire/release pool. Given a factory (creates a new item)
 * and an optional reset function (cleans an item before it's reused),
 * this avoids allocating new THREE geometries/meshes at runtime -
 * we build a handful up front and recycle them forever.
 */
export class ObjectPool {
  constructor(factory, reset, initialSize = 0) {
    this._factory = factory;
    this._reset = reset;
    this._pool = [];

    for (let i = 0; i < initialSize; i++) {
      this._pool.push(this._factory());
    }
  }

  acquire() {
    return this._pool.pop() ?? this._factory();
  }

  release(item) {
    this._reset?.(item);
    this._pool.push(item);
  }

  get availableCount() {
    return this._pool.length;
  }
}
