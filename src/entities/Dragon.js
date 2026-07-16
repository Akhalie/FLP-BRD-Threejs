import * as THREE from 'three';
import { CONFIG, PALETTE } from '../utils/Constants.js';
import { createCelMaterial } from '../materials/CelMaterial.js';
import { addOutline } from '../materials/OutlinePass.js';

const BODY_COLOR = 0x7a2048; // deep crimson-purple, reads as "boss" against the green pipes
const BELLY_COLOR = 0xd98c46;
const WING_COLOR = 0x3a1030;
const HORN_COLOR = 0xe8dcc0;
const EYE_COLOR = 0xffe066;

/**
 * The Dragon boss (DragonEncounter, Phase 5.2). Built from primitive
 * geometry as a stand-in for `dragon.glb` from the asset list, same
 * approach as Bird.js.
 *
 * Dragon is intentionally dumb, same philosophy as Bird: it doesn't
 * know about encounter phases, checkpoints, or attacks. It only knows
 * how to sit in the scene, idle-animate, and ease its height toward a
 * target y. DragonEncounter owns *when* to call update() and where to
 * put it on the x axis (fixed on the right during ACTIVE, tweened
 * during INTRO/OUTRO - see docs/phase5-encounters.md's "Dragon
 * Behaviour" section).
 *
 * The head faces -x (toward the bird, which sits further left) since
 * the dragon always holds position screen-right.
 */
export class Dragon {
  constructor() {
    this.group = new THREE.Group();

    const bodyGeometry = new THREE.SphereGeometry(0.55, 8, 6);
    bodyGeometry.scale(1.35, 0.85, 0.85);
    const bodyMaterial = createCelMaterial({ color: BODY_COLOR, rimColor: PALETTE.neon.magenta, rimIntensity: 0.6 });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.group.add(this.body);
    // Outline on the main body only - same "primary silhouette gets
    // the outline" call as Bird.js, since a per-part outline on every
    // horn/wing/tail segment would just read as noise on a boss this
    // detailed.
    addOutline(this.body, { color: PALETTE.neutral.charcoal, scale: 1.1 });

    const bellyGeometry = new THREE.SphereGeometry(0.32, 8, 6);
    bellyGeometry.scale(1.3, 0.7, 0.8);
    const bellyMaterial = createCelMaterial({ color: BELLY_COLOR, rimColor: PALETTE.neon.orange, rimIntensity: 0.4 });
    this.belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
    this.belly.position.set(0, -0.28, 0);
    this.group.add(this.belly);

    // Head assembly (snout, horns, eyes) lives in its own group so the
    // whole thing can bob independently of the body during idle/update.
    this.head = new THREE.Group();
    this.head.position.set(-0.75, 0.18, 0);
    this.group.add(this.head);

    const skullGeometry = new THREE.BoxGeometry(0.45, 0.4, 0.42);
    const skullMaterial = createCelMaterial({ color: BODY_COLOR, rimColor: PALETTE.neon.magenta, rimIntensity: 0.6 });
    const skull = new THREE.Mesh(skullGeometry, skullMaterial);
    this.head.add(skull);

    const snoutGeometry = new THREE.ConeGeometry(0.16, 0.5, 4);
    const snoutMaterial = createCelMaterial({ color: BODY_COLOR, rimColor: PALETTE.neon.magenta, rimIntensity: 0.6 });
    const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.rotation.z = Math.PI / 2;
    snout.position.set(-0.42, -0.03, 0);
    this.head.add(snout);

    const hornGeometry = new THREE.ConeGeometry(0.07, 0.32, 4);
    const hornMaterial = createCelMaterial({ color: HORN_COLOR, rimColor: PALETTE.neon.cyan, rimIntensity: 0.3 });
    this.leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    this.leftHorn.position.set(0.05, 0.28, 0.12);
    this.leftHorn.rotation.z = -0.35;
    this.rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    this.rightHorn.position.set(0.05, 0.28, -0.12);
    this.rightHorn.rotation.z = -0.35;
    this.head.add(this.leftHorn, this.rightHorn);

    const eyeGeometry = new THREE.SphereGeometry(0.05, 6, 6);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: EYE_COLOR });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.18, 0.06, 0.16);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.18, 0.06, -0.16);
    this.head.add(leftEye, rightEye);

    // Wings, hinged from a shoulder pivot so flap rotation reads
    // naturally instead of rotating around the wing's own center.
    const wingGeometry = new THREE.BoxGeometry(0.75, 0.06, 0.45);
    wingGeometry.translate(0, 0, 0.22); // pushes the pivot to the root edge of the wing
    const wingMaterial = createCelMaterial({ color: WING_COLOR, rimColor: PALETTE.neon.cyan, rimIntensity: 0.7 });

    this.leftWingPivot = new THREE.Group();
    this.leftWingPivot.position.set(0.05, 0.25, 0.28);
    this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.leftWingPivot.add(this.leftWing);
    this.group.add(this.leftWingPivot);

    this.rightWingPivot = new THREE.Group();
    this.rightWingPivot.position.set(0.05, 0.25, -0.28);
    this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.rightWing.scale.z = -1;
    this.rightWingPivot.add(this.rightWing);
    this.group.add(this.rightWingPivot);

    // Tail: a few tapering segments swaying as one unit, extending +x
    // (opposite the head) since the dragon faces -x toward the bird.
    this.tail = new THREE.Group();
    this.tail.position.set(0.55, -0.05, 0);
    this.group.add(this.tail);

    const tailMaterial = createCelMaterial({ color: BODY_COLOR, rimColor: PALETTE.neon.magenta, rimIntensity: 0.5 });
    const segmentCount = 3;
    for (let i = 0; i < segmentCount; i++) {
      const t = i / (segmentCount - 1);
      const radius = THREE.MathUtils.lerp(0.24, 0.06, t);
      const segGeometry = new THREE.ConeGeometry(radius, 0.42, 6);
      const segment = new THREE.Mesh(segGeometry, tailMaterial);
      segment.rotation.z = -Math.PI / 2;
      segment.position.set(i * 0.38, 0, 0);
      this.tail.add(segment);
    }

    this.group.visible = false;
    this.group.position.set(CONFIG.dragonOffScreenX, CONFIG.dragonBaseY, 0);

    this._timer = 0;
    this._displayY = CONFIG.dragonBaseY;
  }

  /** Places the dragon (used by DragonEncounter to reset state at the start of every fresh fight). */
  setPosition(x, y, z = 0) {
    this.group.position.set(x, y, z);
    this._displayY = y;
  }

  /**
   * Per-frame update: idle animation (wings/tail/breathing) plus a
   * smooth height-follow toward `targetY` (the bird's y). Does NOT
   * touch the x axis - DragonEncounter drives that directly so it can
   * freely tween x during INTRO/OUTRO without fighting this method.
   */
  update(delta, targetY) {
    this._followTarget(targetY);
    this.tickAnimation(delta);
  }

  /**
   * Advances only the idle animation (wings/tail/breathing), without
   * touching position at all. Used by AttackController while it's
   * directly driving the dragon's x *and* y (the Dive attack, Phase
   * 5.4) - calling the full update() there would fight the follow-lerp
   * against whatever position the dive charge just set.
   */
  tickAnimation(delta) {
    this._timer += delta;
    this._animate();
  }

  _followTarget(targetY) {
    const clampedTarget = THREE.MathUtils.clamp(targetY, CONFIG.dragonMinY, CONFIG.dragonMaxY);
    this._displayY = THREE.MathUtils.lerp(this._displayY, clampedTarget, CONFIG.dragonFollowLerp);
    this.group.position.y = this._displayY;
  }

  show() {
    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }

  getPosition() {
    return this.group.position;
  }

  /** Disposes every geometry/material this instance created. Dragon is spawned/despawned per fight, unlike the persistent Bird, so this matters. */
  dispose() {
    this.group.traverse((child) => {
      // Outline meshes share their geometry with their parent mesh and
      // their material across every entity using that outline color
      // (see OutlinePass.js) - neither is owned by this Dragon
      // instance, so disposing them here would break outlines on
      // every other still-alive entity (Bird, Pipe, Coin).
      if (child.isOutlineMesh) return;
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  _animate() {
    // Wings: slow, heavy flap - much slower than the bird's flutter to
    // read as a large, powerful creature rather than a frantic one.
    const flapAngle = Math.sin(this._timer * 3.2) * 0.5 + 0.15;
    this.leftWingPivot.rotation.z = flapAngle;
    this.rightWingPivot.rotation.z = -flapAngle;

    // Tail: gentle side-to-side sway.
    this.tail.rotation.y = Math.sin(this._timer * 1.6) * 0.25;

    // Head: slight bob/turn, independent phase so it doesn't sync with the wings.
    this.head.rotation.y = Math.sin(this._timer * 1.1 + 0.6) * 0.12;
    this.head.position.y = 0.18 + Math.sin(this._timer * 2.1) * 0.03;

    // Body: subtle breathing pulse.
    const breath = 1 + Math.sin(this._timer * 2.4) * 0.02;
    this.body.scale.set(1, breath, breath);
  }
}
