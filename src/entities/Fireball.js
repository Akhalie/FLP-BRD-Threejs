import * as THREE from 'three';

const FIREBALL_RADIUS = 0.18;
const FIREBALL_COLOR = 0xff6a1a;
const GLOW_COLOR = 0xffcf4d;

// Shared by every Fireball instance, same optimization as Coin/Pipe -
// fireballs never differ in shape or color, only position/velocity.
// MeshBasicMaterial (unlit) so they read as glowing magic embers
// regardless of scene lighting/fog, and it's cheaper to render than
// a lit material - relevant since several can be in flight at once.
const CORE_GEOMETRY = new THREE.SphereGeometry(FIREBALL_RADIUS, 8, 6);
const CORE_MATERIAL = new THREE.MeshBasicMaterial({ color: FIREBALL_COLOR });
const GLOW_GEOMETRY = new THREE.SphereGeometry(FIREBALL_RADIUS * 1.6, 8, 6);
const GLOW_MATERIAL = new THREE.MeshBasicMaterial({
  color: GLOW_COLOR,
  transparent: true,
  opacity: 0.35,
});

/**
 * A single dragon fireball (Dragon Encounter's Fireball Attack, Phase
 * 5.3). Pooled and repositioned rather than recreated, same pattern
 * as Pipe/Coin: ProjectileSystem calls `spawn(x, y, vx, vy)` to
 * launch it on a straight-line path, `update(delta)` to move it, and
 * checks `.active` / `getPosition()` to know when to recycle it.
 *
 * Unlike Pipe (which only ever moves along -x at a shared speed),
 * a fireball's velocity is set per-shot so AttackController can aim
 * it at wherever the bird was when it fired.
 */
export class Fireball {
  constructor() {
    this.group = new THREE.Group();

    this.core = new THREE.Mesh(CORE_GEOMETRY, CORE_MATERIAL);
    this.glow = new THREE.Mesh(GLOW_GEOMETRY, GLOW_MATERIAL);
    this.group.add(this.glow, this.core);

    this.box = new THREE.Box3();
    this.velocity = new THREE.Vector2();
    this.active = false;
    this._spinTimer = 0;
  }

  spawn(x, y, vx, vy) {
    this.group.position.set(x, y, 0);
    this.velocity.set(vx, vy);
    this.group.visible = true;
    this.active = true;
    this._spinTimer = 0;
    this._updateBox();
  }

  update(delta) {
    if (!this.active) return;

    this.group.position.x += this.velocity.x * delta;
    this.group.position.y += this.velocity.y * delta;

    // Cheap tumbling-ember look: spin the core, pulse the glow.
    this._spinTimer += delta;
    this.core.rotation.x += delta * 9;
    this.core.rotation.y += delta * 6;
    const pulse = 1 + Math.sin(this._spinTimer * 14) * 0.12;
    this.glow.scale.setScalar(pulse);

    this._updateBox();
  }

  getPosition() {
    return this.group.position;
  }

  _updateBox() {
    const { x, y } = this.group.position;
    this.box.min.set(x - FIREBALL_RADIUS, y - FIREBALL_RADIUS, -FIREBALL_RADIUS);
    this.box.max.set(x + FIREBALL_RADIUS, y + FIREBALL_RADIUS, FIREBALL_RADIUS);
  }
}
