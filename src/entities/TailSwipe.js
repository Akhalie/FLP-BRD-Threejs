import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

const BAR_COLOR = 0x5c1a3d; // matches the dragon's body/tail crimson-purple, reads as "part of the dragon" reaching across
const GLOW_COLOR = 0x9c3d6b;
const BAR_WIDTH = 0.5;

// Shared geometry/material - every swipe is the same shape, only
// position/sweep differs, same optimization as Fireball/FireBreath.
const BAR_GEOMETRY = new THREE.BoxGeometry(BAR_WIDTH, CONFIG.tailSwipeThickness, 1.6);
const BAR_MATERIAL = new THREE.MeshLambertMaterial({ color: BAR_COLOR });
const GLOW_GEOMETRY = new THREE.BoxGeometry(BAR_WIDTH * 1.3, CONFIG.tailSwipeThickness * 1.2, 1.8);
const GLOW_MATERIAL = new THREE.MeshBasicMaterial({
  color: GLOW_COLOR,
  transparent: true,
  opacity: 0.25,
});

/**
 * The Tail Swipe hazard (Dragon Encounter's Tail Swipe attack, Phase
 * 5.4 - docs/phase5-encounters.md's "Tail Swipe" section: "Dragon
 * swings across the screen. Large hitbox. Slow animation. Easy to
 * understand.").
 *
 * Represented as one big bar - deliberately larger/simpler than a
 * Fireball or a FireBreath chunk, with no gap to thread - that travels
 * from the dragon toward the bird while its vertical center sweeps
 * smoothly from its starting height toward the far side of the play
 * area (see CONFIG.tailSwipeSweepRange/tailSwipeSweepDuration). The
 * bird dodges by tracking (or anticipating) the sweep rather than
 * threading a fixed gap, which is what makes this read distinctly
 * from Fire Breath despite both being "a wall that crosses the
 * screen". Pooled/repositioned like Fireball rather than recreated.
 */
export class TailSwipe {
  constructor() {
    this.group = new THREE.Group();
    this.bar = new THREE.Mesh(BAR_GEOMETRY, BAR_MATERIAL);
    this.glow = new THREE.Mesh(GLOW_GEOMETRY, GLOW_MATERIAL);
    this.group.add(this.glow, this.bar);

    this.box = new THREE.Box3();
    this.active = false;
    this._elapsed = 0;
    this._startY = 0;
    this._endY = 0;
  }

  /** Launches the sweep at `x`, starting centered on `startY` and sweeping toward whichever bound of the play area is furthest away. */
  spawn(x, startY) {
    this._elapsed = 0;
    this._startY = startY;

    // Sweeps toward whichever bound is further away, so the swing always
    // covers meaningful distance instead of occasionally being a token flick.
    const towardCeiling = CONFIG.ceilingY - startY >= startY - CONFIG.groundY;
    this._endY = towardCeiling
      ? Math.min(CONFIG.ceilingY - 0.5, startY + CONFIG.tailSwipeSweepRange)
      : Math.max(CONFIG.groundY + 0.5, startY - CONFIG.tailSwipeSweepRange);

    this.group.position.set(x, startY, 0);
    this.group.visible = true;
    this.active = true;
    this._updateBox();
  }

  update(delta) {
    if (!this.active) return;
    this._elapsed += delta;

    this.group.position.x -= CONFIG.tailSwipeSpeed * delta;

    const t = THREE.MathUtils.clamp(this._elapsed / CONFIG.tailSwipeSweepDuration, 0, 1);
    const eased = t * t * (3 - 2 * t); // smoothstep - eases into and out of the sweep
    this.group.position.y = THREE.MathUtils.lerp(this._startY, this._endY, eased);

    this._updateBox();
  }

  getX() {
    return this.group.position.x;
  }

  _updateBox() {
    const { x, y } = this.group.position;
    const halfThickness = CONFIG.tailSwipeThickness / 2;
    this.box.min.set(x - BAR_WIDTH / 2, y - halfThickness, -0.8);
    this.box.max.set(x + BAR_WIDTH / 2, y + halfThickness, 0.8);
  }
}
