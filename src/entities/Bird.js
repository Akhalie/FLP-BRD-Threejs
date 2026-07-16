import * as THREE from 'three';
import { CONFIG, PALETTE } from '../utils/Constants.js';
import { createCelMaterial } from '../materials/CelMaterial.js';
import { addOutline } from '../materials/OutlinePass.js';

const START_POSITION = new THREE.Vector3(-1.5, 1, 0);
const BODY_COLOR = 0xf4d35e;
const WING_COLOR = 0xe8b923;
const BEAK_COLOR = 0xe8611c;

/**
 * The player character. Built from primitive geometry as a stand-in
 * for `bird.glb` from the asset list until the model pipeline exists.
 *
 * State is intentionally dumb: Bird doesn't know about GameState - it
 * just exposes jump()/update()/hover()/die()/reset() and Game.js
 * decides which to call based on the current state.
 */
export class Bird {
  constructor() {
    this.group = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const bodyMaterial = createCelMaterial({ color: BODY_COLOR, rimColor: PALETTE.neon.cyan });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.group.add(this.body);
    // Outline on the body only - it's the bird's primary silhouette;
    // beak/wings are small enough that a per-part outline would just
    // read as visual noise (see STYLE_PHASE_2's acceptance criteria).
    addOutline(this.body, { color: PALETTE.neutral.charcoal, scale: 1.15 });

    const beakGeometry = new THREE.ConeGeometry(0.12, 0.3, 4);
    const beakMaterial = createCelMaterial({ color: BEAK_COLOR, rimColor: PALETTE.neon.orange });
    this.beak = new THREE.Mesh(beakGeometry, beakMaterial);
    this.beak.rotation.z = -Math.PI / 2;
    this.beak.position.set(0.35, 0.05, 0);
    this.group.add(this.beak);

    const wingGeometry = new THREE.BoxGeometry(0.3, 0.12, 0.35);
    const wingMaterial = createCelMaterial({ color: WING_COLOR, rimColor: PALETTE.neon.cyan });
    this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.leftWing.position.set(-0.05, 0, 0.3);
    this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.rightWing.position.set(-0.05, 0, -0.3);
    this.group.add(this.leftWing, this.rightWing);

    this.velocity = 0;
    this.alive = true;
    this.box = new THREE.Box3();

    this._wingTimer = 0;
    this._flapPulse = 0; // decays after each jump; drives a quick wing-down snap
    this._squash = 0; // 0-1, decays after each jump; drives the body squash-stretch
    this.externalGravity = 0;

    this.reset();
  }

  reset() {
    this.group.position.copy(START_POSITION);
    this.group.rotation.set(0, 0, 0);
    this.velocity = 0;
    this.alive = true;
    this._wingTimer = 0;
    this._flapPulse = 0;
    this._squash = 0;
    this.body.scale.set(1, 1, 1);
    this.externalGravity = 0;
    this._updateBox();
    
  }

  jump() {
    if (!this.alive) return;
    this.velocity = CONFIG.flapVelocity;
    this._flapPulse = 1;
    this._squash = 1;
  }

  die() {
    this.alive = false;
  }

  /** Gentle idle bob, used while waiting in the READY state before the first flap. */
  hover(delta) {
    this._animateWings(delta, false);
    this._updateSquash(delta);
    this.group.position.y = START_POSITION.y + Math.sin(this._wingTimer * 3) * 0.08;
    this._updateBox();
  }

  /** Full physics tick. Gravity always applies - even a dead bird keeps falling to the ground. */
  update(delta) {
    this.velocity +=
    (
        CONFIG.gravity +
        this.externalGravity
    ) * delta;
    this.velocity = Math.max(this.velocity, CONFIG.maxFallSpeed);
    this.velocity = Math.min(this.velocity, CONFIG.maxRiseSpeed);
    this.group.position.y += this.velocity * delta;

    this._updateTilt();
    this._animateWings(delta, this.alive);
    this._updateSquash(delta);
    this._updateBox();
  }

  getPosition() {
    return this.group.position;
  }

  /** Applies a shop-equipped skin color to the body only (wings/beak stay put - see ShopSystem's doc comment). */
  setBodyColor(color) {
    this.body.material.color.setHex(color);
  }

  _updateTilt() {
    // Classic Flappy Bird feel: nose up right after a flap, diving tilt while falling.
    const targetTilt = THREE.MathUtils.clamp(this.velocity / CONFIG.flapVelocity, -1, 1);
    const targetRotZ = THREE.MathUtils.degToRad(targetTilt * 35);
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, targetRotZ, 0.15);
  }

  _animateWings(delta, flapping) {
    this._wingTimer += delta;
    this._flapPulse = Math.max(0, this._flapPulse - delta * 4);

    const idleMotion = flapping
      ? Math.sin(this._wingTimer * 14) * 0.5 // fast flutter while actively flying
      : Math.sin(this._wingTimer * 3) * 0.15; // slow idle drift while hovering/dead

    const snap = this._flapPulse * 0.9; // sharp downstroke right after jump()
    const angle = idleMotion + snap;

    this.leftWing.rotation.x = angle;
    this.rightWing.rotation.x = -angle;
  }

  /**
   * Classic squash-and-stretch: a sharp squash (wide/short) right on
   * the flap impulse that decays back to neutral, blended with a
   * gentle stretch (tall/thin) proportional to downward speed so a
   * fast fall reads as the body "stretching" toward the ground.
   */
  _updateSquash(delta) {
    this._squash = Math.max(0, this._squash - delta * CONFIG.squashRecoverySpeed);

    const flapSquashAmount = this._squash * CONFIG.squashOnFlap;
    const fallStretchAmount = this.alive
      ? THREE.MathUtils.clamp(-this.velocity / -CONFIG.maxFallSpeed, 0, 1) * 0.15
      : 0;

    // Squash: shorter + wider. Stretch: taller + thinner. Both move
    // scaleY and scaleXZ in opposite directions so volume feels preserved.
    const scaleY = 1 - flapSquashAmount + fallStretchAmount;
    const scaleXZ = 1 + flapSquashAmount * 0.6 - fallStretchAmount * 0.4;

    this.body.scale.set(scaleXZ, scaleY, scaleXZ);
  }

  _updateBox() {
    this.group.updateMatrixWorld(true);
    this.box.setFromObject(this.body);
  }
}