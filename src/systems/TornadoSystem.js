import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

/**
 * Occasional tornado hazard for the Storm encounter (docs/storm.md's
 * "Tornado" section). Unlike every other Storm hazard, flying through
 * one is a *reward*, not a threat: it launches the bird straight up to
 * CONFIG.maxRiseSpeed once per pass, which players can use to dodge a
 * threat above - or fly into by accident and get launched into one.
 *
 * Only one tornado exists at a time, spawned on a timer and despawned
 * once it scrolls off the left edge, the same recycle pattern as
 * WindSystem's zones but for a single hazard instead of a pool.
 */
export class TornadoSystem {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;
    this.timer = 0;
    this.tornado = null; // { x, group, triggered }
  }

  start() {
    this.timer = 0;
    this.tornado = null;
  }

  enable() {
    this.enabled = true;
  }

  /** Called on victory so no tornado can still be mid-screen (or launch the bird) during the outro. */
  disable() {
    this.enabled = false;
    this._despawn();
    this.timer = 0;
  }

  update(delta) {
    if (!this.enabled) return;

    if (!this.tornado) {
      this.timer += delta;
      if (this.timer >= CONFIG.stormTornadoInterval) this._spawn();
      return;
    }

    this.tornado.x -= CONFIG.stormTornadoSpeed * delta;
    this.tornado.group.position.x = this.tornado.x;
    this.tornado.group.rotation.y += CONFIG.stormTornadoSpinSpeed * delta;

    if (this.tornado.x < -10) this._despawn();
  }

  /** Builds a stack of shrinking, spinning rings (a simple funnel silhouette) and starts it off-screen right. */
  _spawn() {
    const group = new THREE.Group();

    for (let i = 0; i < CONFIG.stormTornadoSegments; i++) {
      const t = i / (CONFIG.stormTornadoSegments - 1);
      const radius = CONFIG.stormTornadoBaseRadius * (1 - t * 0.6);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.05, 6, 12),
        new THREE.MeshBasicMaterial({ color: 0xcfd8dc, transparent: true, opacity: 0.5 - t * 0.25, depthWrite: false })
      );
      ring.position.y = CONFIG.groundY + t * CONFIG.stormTornadoHeight;
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }

    group.position.set(14, 0, -0.6);
    this.scene.add(group);

    this.tornado = { x: 14, group, triggered: false };
    this.timer = 0;
  }

  _despawn() {
    if (!this.tornado) return;

    for (const ring of this.tornado.group.children) {
      ring.geometry.dispose();
      ring.material.dispose();
    }
    this.scene.remove(this.tornado.group);
    this.tornado = null;
  }

  /** Launches the bird to max rise speed once per tornado pass - a boost, never a hit. */
  applyToBird(bird) {
    if (!this.enabled || !this.tornado || this.tornado.triggered) return;

    const x = bird.getPosition().x;
    if (Math.abs(x - this.tornado.x) <= CONFIG.stormTornadoWidth) {
      bird.velocity = CONFIG.maxRiseSpeed;
      this.tornado.triggered = true;
    }
  }

  dispose() {
    this._despawn();
  }
}
