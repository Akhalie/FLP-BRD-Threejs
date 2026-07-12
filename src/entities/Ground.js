import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

const SEGMENT_WIDTH = 12;
const SEGMENT_COUNT = 3; // 3 is the minimum that guarantees no visible seam at this width/speed

/**
 * Endless scrolling ground: a handful of plane segments placed
 * edge-to-edge that get shuffled back to the tail end once they
 * scroll off the left edge, giving the illusion of infinite ground
 * with a fixed, tiny mesh/material footprint (geometry + material are
 * shared across all segments - see Optimization goals in the plan).
 */
export class Ground {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];

    const geometry = new THREE.PlaneGeometry(SEGMENT_WIDTH, 20, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x4a9c4a });

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(i * SEGMENT_WIDTH, CONFIG.groundY, 0);
      this.scene.add(mesh);
      this.segments.push(mesh);
    }
  }

  update(delta, speed) {
    const totalWidth = SEGMENT_WIDTH * SEGMENT_COUNT;

    for (const segment of this.segments) {
      segment.position.x -= speed * delta;

      if (segment.position.x <= -SEGMENT_WIDTH) {
        segment.position.x += totalWidth;
      }
    }
  }
}
