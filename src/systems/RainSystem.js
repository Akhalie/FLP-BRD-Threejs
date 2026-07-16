import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

/**
 * Atmospheric rain for the Storm encounter (docs/storm.md's "Heavy Rain"
 * section: purely visual, never affects gameplay - it exists to raise
 * tension and reduce visibility, not difficulty).
 *
 * A single THREE.Points cloud of CONFIG.stormRainCount drops, each
 * falling straight down and recycled back to the top the moment it
 * passes the ground - one shared BufferGeometry/material for the
 * whole system instead of one mesh per drop.
 */
export class RainSystem {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;

    this.positions = new Float32Array(CONFIG.stormRainCount * 3);
    this.speeds = new Float32Array(CONFIG.stormRainCount);

    for (let i = 0; i < CONFIG.stormRainCount; i++) {
      this._resetDrop(i, true);
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.PointsMaterial({
      color: CONFIG.stormRainColor,
      size: CONFIG.stormRainSize,
      transparent: true,
      opacity: CONFIG.stormRainOpacity,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.visible = false;
    this.scene.add(this.points);
  }

  /** Drops a rain particle back to a random point near the top of the play area (or anywhere in it, for the initial fill). */
  _resetDrop(i, scatterVertically = false) {
    const i3 = i * 3;
    this.positions[i3] = (Math.random() - 0.5) * CONFIG.stormRainSpreadX;
    this.positions[i3 + 1] = scatterVertically
      ? CONFIG.groundY + Math.random() * (CONFIG.stormRainTopY - CONFIG.groundY)
      : CONFIG.stormRainTopY;
    this.positions[i3 + 2] = CONFIG.stormRainDepth - Math.random() * CONFIG.stormRainDepthSpread;
    this.speeds[i] = CONFIG.stormRainMinSpeed + Math.random() * (CONFIG.stormRainMaxSpeed - CONFIG.stormRainMinSpeed);
  }

  /** Rain is atmospheric-only, so it's fine for it to start with the rest of the intro (docs/storm.md's "Rain Starts" step), well before wind/lightning can actually threaten the bird. */
  enable() {
    this.enabled = true;
    this.points.visible = true;
  }

  /** Called on victory - "Rain Stops" is the first step of the Victory Sequence. */
  disable() {
    this.enabled = false;
    this.points.visible = false;
  }

  update(delta) {
    if (!this.enabled) return;

    for (let i = 0; i < CONFIG.stormRainCount; i++) {
      const i3 = i * 3;
      this.positions[i3 + 1] -= this.speeds[i] * delta;
      if (this.positions[i3 + 1] < CONFIG.groundY) this._resetDrop(i);
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}
