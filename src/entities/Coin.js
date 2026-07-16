import * as THREE from 'three';
import { CONFIG, PALETTE } from '../utils/Constants.js';
import { createCelMaterial } from '../materials/CelMaterial.js';
import { addOutline } from '../materials/OutlinePass.js';

const COIN_RADIUS = 0.28;
const COIN_THICKNESS = 0.08;
const COIN_COLOR = 0xffd54f;

// Shared by every Coin instance (same optimization as Pipe's shared
// geometry/material) - coins never differ in shape or color, only position.
const COIN_GEOMETRY = new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 14);
// Coins get a touch of emissive + a lime rim so they read as the
// "neon pickup" against the cyan/orange cast elsewhere - collectibles
// should stand out as their own accent color (STYLE_GUIDE.md's
// "Emissive maps: for neon panels and accessories").
const COIN_MATERIAL = createCelMaterial({
  color: COIN_COLOR,
  emissive: COIN_COLOR,
  emissiveIntensity: 0.25,
  rimColor: PALETTE.neon.lime,
});

/**
 * A single collectible coin, one spawned in the middle of every pipe
 * gap by PipeSpawner. Pooled and repositioned rather than recreated,
 * same pattern as Pipe: call `spawn(x, y)` to activate it, `update()`
 * to move + spin it, and check `.active` / `getX()` to know when its
 * owning PipeSpawner should recycle it.
 *
 * `collect()` only hides the coin and flags it claimed - it does NOT
 * release the pool slot. PipeSpawner keeps a coin's lifetime tied to
 * its paired pipe so the two despawn together off-screen, same as
 * every other pooled entity in this game.
 */
export class Coin {
  constructor() {
    this.mesh = new THREE.Mesh(COIN_GEOMETRY, COIN_MATERIAL);
    // Cylinder's flat caps face up/down by default; rotate so the flat
    // faces point at the camera instead, reading as a coin, not a wheel.
    this.mesh.rotation.x = Math.PI / 2;
    addOutline(this.mesh, { color: PALETTE.neutral.charcoal, scale: 1.18 });

    this.box = new THREE.Box3();
    this.active = false;
    this.collected = false;
    this._spinTimer = 0;
  }

  spawn(x, y) {
    this.mesh.position.set(x, y, 0);
    this.mesh.rotation.y = 0;
    this.mesh.visible = true;

    this.active = true;
    this.collected = false;
    this._spinTimer = 0;
    this._updateBox();
  }

  update(delta, speed) {
    if (!this.active) return;

    this.mesh.position.x -= speed * delta;

    if (!this.collected) {
      this._spinTimer += delta;
      this.mesh.rotation.z = this._spinTimer * CONFIG.coinSpinSpeed;
    }

    this._updateBox();
  }

  getX() {
    return this.mesh.position.x;
  }

  /** Marks the coin claimed and hides it immediately, without releasing its pool slot (see class doc). */
  collect() {
    this.collected = true;
    this.mesh.visible = false;
  }

  _updateBox() {
    if (this.collected) {
      this.box.makeEmpty();
      return;
    }
    const x = this.mesh.position.x;
    const y = this.mesh.position.y;
    this.box.min.set(x - COIN_RADIUS, y - COIN_RADIUS, -COIN_RADIUS);
    this.box.max.set(x + COIN_RADIUS, y + COIN_RADIUS, COIN_RADIUS);
  }
}
