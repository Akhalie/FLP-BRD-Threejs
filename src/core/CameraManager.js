import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

/**
 * The camera's position/lookAt (see Constants.js) frames the bird
 * left-of-center so there's room ahead to see incoming pipes. That
 * framing was tuned against a landscape aspect ratio - three.js's
 * PerspectiveCamera fov is *vertical*, so on a narrower (portrait/
 * mobile) aspect the horizontal FOV shrinks along with it, which can
 * push the off-center bird outside the frustum entirely (the "bird
 * can't be seen" bug this fixes).
 *
 * Two tempting fixes turn out to be worse than the problem: growing
 * the vertical FOV to compensate needs 120+ degrees on a typical
 * phone aspect (a fisheye look), and dollying the camera back to
 * compensate asymptotically fails - past a certain point moving the
 * camera further away no longer shrinks the bird's angular offset
 * from the view axis, so it still clips off narrow enough screens.
 *
 * Instead, lookXForAspect eases the look-at target's x back toward
 * the bird's lane as the aspect narrows: full look-ahead (room to see
 * incoming pipes) on landscape/tablet, gradually recentering on the
 * bird as the screen gets taller, fully centered by the time it's as
 * narrow as a typical phone. No FOV or distance change, so no
 * distortion or scale change - the camera just pans a little.
 */
const LANDSCAPE_ASPECT = 16 / 9; // at or above this, use the full look-ahead framing
const PORTRAIT_ASPECT = 0.45; // at or below this, look-at is fully centered on the bird's lane

function lookXForAspect(aspect) {
  const fullLookX = CONFIG.cameraLookAt.x;
  if (aspect >= LANDSCAPE_ASPECT) return fullLookX;
  if (aspect <= PORTRAIT_ASPECT) return 0;

  const t = (aspect - PORTRAIT_ASPECT) / (LANDSCAPE_ASPECT - PORTRAIT_ASPECT);
  return fullLookX * t;
}

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
    // y/z of the look-at target never change with aspect - only x eases
    // in via _applyAspect(), so start from the config value and let that
    // call set the real x for the initial aspect.
    this._baseLookAt = new THREE.Vector3(
      CONFIG.cameraLookAt.x,
      CONFIG.cameraLookAt.y,
      CONFIG.cameraLookAt.z
    );

    this.trauma = 0;
    this._shakeTime = 0;

    // Encounter "boss framing" (Phase 5.5): a slight pull-back + constant
    // tilt, eased in/out over cameraEncounterBlendSpeed rather than cut
    // instantly, so it reads as a deliberate camera move rather than a
    // jump cut. Distinct from trauma/shake above - this is a steady
    // offset, not noise - so the two blend together independently.
    this._encounterActive = false;
    this._encounterBlend = 0; // 0 = normal framing, 1 = fully pulled back/tilted
    this._needsRestApply = false; // true once we've moved off the base framing, so we know to snap back exactly on the frame we return to fully at-rest

    this._applyAspect(aspect);
  }

  /** Adds trauma (clamped to 1). Call this on impactful events like death. */
  shake(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  /**
   * Called by BaseEncounter's start()/cleanup() (docs/phase5-encounters.md's
   * "Camera Effects" section) - every encounter gets this for free, same
   * reasoning as BaseEncounter._awardRewards(). true eases the camera into
   * its boss-fight framing; false eases it back to normal.
   */
  setEncounterMode(active) {
    this._encounterActive = active;
  }

  /** Advances shake decay + the encounter blend and re-applies the camera transform. Call once per frame. */
  update(delta) {
    if (this.trauma > 0 || this._shakeTime !== 0) {
      this._shakeTime += delta;
      this.trauma = Math.max(0, this.trauma - CONFIG.cameraShakeDecayPerSecond * delta);
    }

    const blendTarget = this._encounterActive ? 1 : 0;
    if (this._encounterBlend !== blendTarget) {
      const step = CONFIG.cameraEncounterBlendSpeed * delta;
      this._encounterBlend = blendTarget > this._encounterBlend
        ? Math.min(blendTarget, this._encounterBlend + step)
        : Math.max(blendTarget, this._encounterBlend - step);
    }

    if (this.trauma <= 0 && this._shakeTime === 0 && this._encounterBlend === 0) {
      if (this._needsRestApply) {
        this.camera.position.copy(this._basePosition);
        this.camera.rotation.z = 0;
        this.camera.lookAt(this._baseLookAt);
        this._needsRestApply = false;
      }
      return;
    }
    this._needsRestApply = true;

    // Cheap pseudo-noise: offset oscillators at different, non-integer
    // frequencies so each axis drifts independently instead of in lockstep.
    const shakePower = this.trauma * this.trauma; // squared so small trauma is subtle
    const maxOffset = CONFIG.cameraShakeMaxOffset * shakePower;
    const maxRot = CONFIG.cameraShakeMaxRotation * shakePower;
    const t = this._shakeTime;
    const offsetX = maxOffset * Math.sin(t * 27.1);
    const offsetY = maxOffset * Math.sin(t * 31.7 + 1.7);
    const shakeRotZ = maxRot * Math.sin(t * 23.3 + 0.9);

    // Encounter framing: steady pull-back + tilt, scaled by the blend (not noise).
    const zoomOffset = CONFIG.cameraEncounterZoomOut * this._encounterBlend;
    const tiltZ = CONFIG.cameraEncounterTilt * this._encounterBlend;

    this.camera.position.set(
      this._basePosition.x + offsetX,
      this._basePosition.y + offsetY,
      this._basePosition.z + zoomOffset
    );
    this.camera.lookAt(this._baseLookAt);
    this.camera.rotation.z += shakeRotZ + tiltZ;

    if (this.trauma <= 0) this._shakeTime = 0;
  }

  onResize(aspect) {
    this._applyAspect(aspect);
  }

  /** Eases the look-at target's x for this aspect and re-applies position/lookAt to the camera. */
  _applyAspect(aspect) {
    this._baseLookAt.x = lookXForAspect(aspect);

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(this._basePosition);
    this.camera.lookAt(this._baseLookAt);
  }
}