// Tiny dependency-free event emitter. Keeps systems decoupled:
// InputManager doesn't need to know about Bird, Game doesn't need
// to know about UI, etc. Everyone just emits/listens for named events.

export class EventEmitter {
  constructor() {
    this._listeners = new Map();
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback); // returns an unsubscribe fn
  }

  off(event, callback) {
    this._listeners.get(event)?.delete(callback);
  }

  emit(event, payload) {
    this._listeners.get(event)?.forEach((cb) => cb(payload));
  }

  clear() {
    this._listeners.clear();
  }
}
