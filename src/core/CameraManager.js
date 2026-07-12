import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

/**
 * Wraps THREE.PerspectiveCamera, plus a trauma-based shake effect
 * (Phase 3). Trauma is a 0-1 value that decays over time; shake()
 * adds to it (clamped at 1), and update() consumes it every frame to
 * offset the camera away from its base position/look-at using noise
 * proportional to trauma^2 (so small trauma barely shakes, but it
 * ramps up fast as trauma approaches 1). The base position/look-at
 * are stored separately and never mutated, so shake always recovers
 * to exactly where the camera started.
 */
export class CameraManager {
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.cameraFov,
      aspect,
      CONFIG.cameraNear,
      CONFIG.cameraFar
    );

    this._basePosition = new THREE.Vector3(
      CONFIG.cameraPosition.x,
      CONFIG.cameraPosition.y,
      CONFIG.cameraPosition.z
    );
    this._baseLookAt = new THREE.Vector3(
      CONFIG.cameraLookAt.x,
      CONFIG.cameraLookAt.y,
      CONFIG.cameraLookAt.z
    );

    this.trauma = 0;
    this._shakeTime = 0;

    this.camera.position.copy(this._basePosition);
    this.camera.lookAt(this._baseLookAt);
  }

  /** Adds trauma (clamped to 1). Call this on impactful events like death. */
  shake(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  /** Advances shake decay and re-applies the camera offset. Call once per frame. */
  update(delta) {
    if (this.trauma <= 0 && this._shakeTime === 0) return;

    this._shakeTime += delta;
    this.trauma = Math.max(0, this.trauma - CONFIG.cameraShakeDecayPerSecond * delta);

    const shakePower = this.trauma * this.trauma; // squared so small trauma is subtle
    const maxOffset = CONFIG.cameraShakeMaxOffset * shakePower;
    const maxRot = CONFIG.cameraShakeMaxRotation * shakePower;

    // Cheap pseudo-noise: offset oscillators at different, non-integer
    // frequencies so each axis drifts independently instead of in lockstep.
    const t = this._shakeTime;
    const offsetX = maxOffset * Math.sin(t * 27.1);
    const offsetY = maxOffset * Math.sin(t * 31.7 + 1.7);
    const rotZ = maxRot * Math.sin(t * 23.3 + 0.9);

    this.camera.position.set(
      this._basePosition.x + offsetX,
      this._basePosition.y + offsetY,
      this._basePosition.z
    );
    this.camera.lookAt(this._baseLookAt);
    this.camera.rotation.z += rotZ;

    if (this.trauma <= 0) {
      this._shakeTime = 0;
      this.camera.position.copy(this._basePosition);
      this.camera.lookAt(this._baseLookAt);
    }
  }

  onResize(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
