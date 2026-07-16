import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

const WALL_HALF_WIDTH = 0.35; // thin along x - it's a sheet of flame, not a solid pipe
const CORE_COLOR = 0xff4d1f;
const GLOW_COLOR = 0xffb347;

// Shared geometry/material - every fire breath wall is the same shape,
// only position/gap differs, same optimization as Fireball/Pipe.
const CHUNK_GEOMETRY = new THREE.BoxGeometry(WALL_HALF_WIDTH * 2, CONFIG.fireBreathThickness, 1.4);
const CHUNK_MATERIAL = new THREE.MeshLambertMaterial({ color: CORE_COLOR });
const GLOW_GEOMETRY = new THREE.BoxGeometry(WALL_HALF_WIDTH * 2.6, CONFIG.fireBreathThickness * 1.15, 1.55);
const GLOW_MATERIAL = new THREE.MeshBasicMaterial({
  color: GLOW_COLOR,
  transparent: true,
  opacity: 0.3,
});

/**
 * The Fire Breath wall (Dragon Encounter's Fire Breath attack, Phase
 * 5.4 - docs/phase5-encounters.md's "Fire Breath" section: "Creates a
 * moving wall. Player must fly above or below.").
 *
 * Structurally this is a Pipe with fire styling instead of a pipe's
 * green cylinders: two solid chunks (top/bottom) separated by a gap,
 * moving in a straight line at a fixed speed. Two differences from a
 * real Pipe: it originates from the dragon's mouth instead of
 * spawning at the world edge, and the gap is aimed at the bird's
 * height at cast time (AttackController._fireFireBreath) rather than
 * random. Pooled/repositioned like Fireball rather than recreated.
 */
export class FireBreath {
  constructor() {
    this.group = new THREE.Group();

    this.topChunk = new THREE.Mesh(CHUNK_GEOMETRY, CHUNK_MATERIAL);
    this.topGlow = new THREE.Mesh(GLOW_GEOMETRY, GLOW_MATERIAL);
    this.bottomChunk = new THREE.Mesh(CHUNK_GEOMETRY, CHUNK_MATERIAL);
    this.bottomGlow = new THREE.Mesh(GLOW_GEOMETRY, GLOW_MATERIAL);
    this.group.add(this.topChunk, this.topGlow, this.bottomChunk, this.bottomGlow);

    this.topBox = new THREE.Box3();
    this.bottomBox = new THREE.Box3();
    this._topY = 0;
    this._bottomY = 0;

    this.active = false;
  }

  /** Launches a wall at `x` with a gap centered on `gapCenterY` - the bird must be inside the gap when the wall reaches it. */
  spawn(x, gapCenterY) {
    const halfGap = CONFIG.fireBreathGapHeight / 2;
    const halfThickness = CONFIG.fireBreathThickness / 2;
    this._topY = gapCenterY + halfGap + halfThickness;
    this._bottomY = gapCenterY - halfGap - halfThickness;

    this.topChunk.position.y = this._topY;
    this.topGlow.position.y = this._topY;
    this.bottomChunk.position.y = this._bottomY;
    this.bottomGlow.position.y = this._bottomY;

    this.group.position.set(x, 0, 0);
    this.group.visible = true;
    this.active = true;
    this._updateBoxes();
  }

  update(delta) {
    if (!this.active) return;
    this.group.position.x -= CONFIG.fireBreathSpeed * delta;
    this._updateBoxes();
  }

  getX() {
    return this.group.position.x;
  }

  _updateBoxes() {
    const x = this.group.position.x;
    const halfThickness = CONFIG.fireBreathThickness / 2;
    this.topBox.min.set(x - WALL_HALF_WIDTH, this._topY - halfThickness, -0.7);
    this.topBox.max.set(x + WALL_HALF_WIDTH, this._topY + halfThickness, 0.7);
    this.bottomBox.min.set(x - WALL_HALF_WIDTH, this._bottomY - halfThickness, -0.7);
    this.bottomBox.max.set(x + WALL_HALF_WIDTH, this._bottomY + halfThickness, 0.7);
  }
}
