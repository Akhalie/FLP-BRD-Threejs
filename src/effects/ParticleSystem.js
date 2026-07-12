import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

const FEATHER_COLORS = [0xf4d35e, 0xe8b923, 0xffffff];
const DUST_COLOR = 0xcbb98f;
const SPARKLE_COLOR = 0xffe066;

// Shared by every Particle instance (Phase 4 optimization) - all particles
// use the same base quad size and only ever differ by .scale, so there's
// no need for each of the pool's 32 instances to own its own geometry.
const PARTICLE_GEOMETRY = new THREE.PlaneGeometry(0.12, 0.12);

/**
 * A single pooled particle: one small flat quad with its own velocity,
 * gravity, spin, and lifetime. Kept intentionally dumb (no per-effect
 * subclassing) - ParticleSystem configures each one at spawn time,
 * matching the low-poly art direction (simple shapes, no textures).
 */
class Particle {
  constructor() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(PARTICLE_GEOMETRY, material);
    this.velocity = new THREE.Vector3();
    this.spinSpeed = 0;
    this.gravity = 0;
    this.life = 0;
    this.maxLife = 1;
    this.active = false;
  }

  spawn({ position, velocity, color, gravity, spinSpeed, life, scale }) {
    this.mesh.position.copy(position);
    this.mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    this.mesh.scale.setScalar(scale);
    this.mesh.material.color.setHex(color);
    this.mesh.material.opacity = 1;

    this.velocity.copy(velocity);
    this.gravity = gravity;
    this.spinSpeed = spinSpeed;
    this.life = life;
    this.maxLife = life;
    this.active = true;
    this.mesh.visible = true;
  }

  update(delta) {
    if (!this.active) return;

    this.life -= delta;
    if (this.life <= 0) {
      this.active = false;
      this.mesh.visible = false;
      return;
    }

    this.velocity.y += this.gravity * delta;
    this.mesh.position.addScaledVector(this.velocity, delta);
    this.mesh.rotation.z += this.spinSpeed * delta;
    this.mesh.material.opacity = Math.max(0, this.life / this.maxLife);
  }
}

/**
 * Owns a fixed pool of Particle instances shared by every effect
 * (feathers, dust) so we never allocate meshes mid-game. Call
 * burstFeathers(position) on death and burstDust(position) on
 * landing; update(delta) must be called once per frame from Game.
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    for (let i = 0; i < CONFIG.particlePoolSize; i++) {
      const particle = new Particle();
      particle.mesh.visible = false;
      this.scene.add(particle.mesh);
      this.particles.push(particle);
    }
  }

  update(delta) {
    for (const particle of this.particles) {
      particle.update(delta);
    }
  }

  /** Feathers scatter outward and fall - used on death (pipe/ground hit). */
  burstFeathers(position) {
    for (let i = 0; i < CONFIG.featherBurstCount; i++) {
      const particle = this._acquire();
      if (!particle) return;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2;

      particle.spawn({
        position,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * 2.5 + 0.5,
          Math.sin(angle) * speed
        ),
        color: FEATHER_COLORS[i % FEATHER_COLORS.length],
        gravity: -6,
        spinSpeed: (Math.random() - 0.5) * 10,
        life: 0.6 + Math.random() * 0.4,
        scale: 0.8 + Math.random() * 0.6,
      });
    }
  }

  /** Low, wide puff that drifts sideways and settles - used on landing. */
  burstDust(position) {
    for (let i = 0; i < CONFIG.dustPuffCount; i++) {
      const particle = this._acquire();
      if (!particle) return;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 0.8;

      particle.spawn({
        position,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * 0.6 + 0.2,
          Math.sin(angle) * speed
        ),
        color: DUST_COLOR,
        gravity: -2,
        spinSpeed: (Math.random() - 0.5) * 3,
        life: 0.35 + Math.random() * 0.25,
        scale: 0.5 + Math.random() * 0.5,
      });
    }
  }

  /** Quick upward, no-gravity sparkle burst - used when a coin is collected. */
  burstCoinSparkle(position) {
    for (let i = 0; i < CONFIG.coinSparkleCount; i++) {
      const particle = this._acquire();
      if (!particle) return;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.2;

      particle.spawn({
        position,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * 1.8 + 0.8,
          Math.sin(angle) * speed
        ),
        color: SPARKLE_COLOR,
        gravity: 0, // sparkles float rather than fall, unlike feathers/dust
        spinSpeed: (Math.random() - 0.5) * 12,
        life: 0.3 + Math.random() * 0.2,
        scale: 0.4 + Math.random() * 0.3,
      });
    }
  }

  _acquire() {
    return this.particles.find((particle) => !particle.active) ?? null;
  }
}
