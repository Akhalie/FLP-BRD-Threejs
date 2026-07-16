import * as THREE from 'three';

/**
 * Reusable world-space warning icon (a triangle "!" sign), fully
 * transparent until show()'d. Used by encounters right before a
 * dangerous, telegraphed attack.
 *
 * Currently used by:
 *  - Storm Lightning
 *
 * Future uses:
 *  - Volcano Meteors
 *  - UFO Laser
 *  - Dragon Dive
 */
export class WarningIndicator {
  constructor(scene) {
    this.scene = scene;

    let material;
    if (typeof document !== 'undefined') {
      // Canvas-drawn triangle-with-exclamation-mark texture - avoids
      // shipping a sprite asset for something this simple.
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1f1b15';
      ctx.beginPath();
      ctx.moveTo(128, 20);
      ctx.lineTo(232, 208);
      ctx.lineTo(24, 208);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffd54a';
      ctx.beginPath();
      ctx.moveTo(128, 44);
      ctx.lineTo(208, 190);
      ctx.lineTo(48, 190);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#d62828';
      ctx.font = 'bold 130px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 128, 154);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;

      material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    } else {
      // No DOM (e.g. Node test environment) - flat-color fallback so this class stays constructible/testable headless.
      material = new THREE.MeshBasicMaterial({
        color: 0xffee66,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    }

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), material);
    this.mesh.position.set(0, 0.9, -1.5);
    scene.add(this.mesh);
  }

  /** Shows the indicator at world x, slightly oversized (a quick pop-in read). */
  show(x) {
    this.mesh.position.x = x;
    this.mesh.material.opacity = 1;
    this.mesh.scale.set(1.05, 1.05, 1);
  }

  hide() {
    this.mesh.material.opacity = 0;
    this.mesh.scale.set(1, 1, 1);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
