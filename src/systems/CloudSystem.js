import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

/**
 * Decorative rolling cloud layer for the Storm encounter (docs/storm.md's
 * "Environment Changes" section). Purely visual - no gameplay logic,
 * no hit-testing, nothing StormController needs to query beyond
 * update()/dispose().
 */
export class CloudSystem {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
  }

  /** Spawns CONFIG.stormCloudCount flat quads at random size/height/drift-speed, scattered across the play area. */
  start() {
    for (let i = 0; i < CONFIG.stormCloudCount; i++) {
      const scale = CONFIG.stormCloudMinScale + Math.random() * (CONFIG.stormCloudMaxScale - CONFIG.stormCloudMinScale);

      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: CONFIG.stormCloudOpacity,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(scale * 1.6, scale * 0.9), material);
      mesh.position.set(
        (Math.random() - 0.5) * CONFIG.stormCloudSpread,
        3.8 + Math.random() * 2.2,
        CONFIG.stormCloudDepth
      );
      mesh.rotation.z = Math.random() * 0.2;
      this.scene.add(mesh);

      this.clouds.push({
        mesh,
        x: mesh.position.x,
        y: mesh.position.y,
        drift: (Math.random() * 0.6 + 0.2) * CONFIG.stormCloudDrift, // per-cloud speed variance so the layer doesn't scroll in lockstep
      });
    }
  }

  /** Drifts every cloud rightward, wrapping back to the left edge, plus a slow scale pulse so the layer doesn't feel static. */
  update(delta) {
    for (const cloud of this.clouds) {
      cloud.x += cloud.drift * delta;
      if (cloud.x > CONFIG.stormCloudResetX) cloud.x = -CONFIG.stormCloudResetX;
      cloud.mesh.position.x = cloud.x;

      cloud.mesh.scale.setScalar(1 + Math.sin((cloud.x + cloud.y) * 0.8) * 0.03);
    }
  }

  dispose() {
    for (const cloud of this.clouds) {
      this.scene.remove(cloud.mesh);
      cloud.mesh.geometry.dispose();
      cloud.mesh.material.dispose();
    }
    this.clouds.length = 0;
  }
}
