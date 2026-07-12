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

    this._setupLights();
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);

    const directional = new THREE.DirectionalLight(0xfff4d6, 0.9);
    directional.position.set(-4, 6, 3);

    this.scene.add(ambient, directional);
  }
}
