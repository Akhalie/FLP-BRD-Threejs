import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

/**
 * Owns the THREE.Scene, its lighting, and its fog. Entities (Bird,
 * Ground, Pipes) are created and added to `.scene` by Game.js /
 * their owning systems - this class only owns environment-wide
 * concerns that don't belong to any single entity.
 *
 * Environment dressing from the plan (mountains, clouds, trees, rocks)
 * lands here in a later phase; for now it's just fog + lights.
 */
export class SceneManager {
  constructor() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(CONFIG.skyColor);
      this.scene.fog = new THREE.FogExp2(CONFIG.fogColor, CONFIG.fogDensity);

      this._baseFogDensity = CONFIG.fogDensity;

      // Lightning flash
      this._flashStrength = 0;
      this._flashColor = new THREE.Color(0xeedd99);
      this._baseBackground = new THREE.Color(CONFIG.skyColor);

      this._setupLights();
  }

  /** Thickens fog for an encounter's intro ("Fog darkens" in the WARNING sequence). Idempotent. */
  darkenFog(factor = CONFIG.encounterFogDarkenFactor) {
      this.scene.fog.density = this._baseFogDensity * factor;
  }

  /** Restores normal fog density ("Fog clears" in the victory sequence). */
  restoreFog() {
    this.scene.fog.density = this._baseFogDensity;
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);

    const directional = new THREE.DirectionalLight(0xfff4d6, 0.9);
    directional.position.set(-4, 6, 3);

    this.scene.add(ambient, directional);
  }

  flashLightning() {

    this._flashStrength = 1;

}

  update(delta) {

      this._flashStrength = Math.max(
          0,
          this._flashStrength - delta * 12
      );

      this.scene.background.copy(this._baseBackground);

      if (this._flashStrength > 0) {

          this.scene.background.lerp(
              this._flashColor,
              this._flashStrength
          );

      }

  }

}
