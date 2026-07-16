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

    // Stylization Phase 5: a stronger pulse than a static icon, so this
    // gameplay-critical readout still reads clearly against Phase 3's
    // bloom/grade. Self-contained (no per-frame caller needed) since
    // LightningSystem only calls show()/hide() once per phase change.
    this._visible = false;
    this._pulseT = 0;
    this._boundTick = this._tick.bind(this);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(this._boundTick);
    }
  }

  /** Shows the indicator at world (x, y), slightly oversized (a quick pop-in read). y defaults to its current height if omitted. */
  show(x, y = this.mesh.position.y) {
    this.mesh.position.x = x;
    this.mesh.position.y = y;
    this._visible = true;
    this._pulseT = 0;
    this.mesh.material.opacity = 1;
    this.mesh.scale.set(1.05, 1.05, 1);
  }

  hide() {
    this._visible = false;
    this.mesh.material.opacity = 0;
    this.mesh.scale.set(1, 1, 1);
  }

  _tick(time) {
    requestAnimationFrame(this._boundTick);
    if (!this._visible) return;

    // ~2.4Hz pulse: opacity swings between 0.55-1, scale between 1.0-1.12.
    const t = time * 0.0024;
    const wave = (Math.sin(t) + 1) / 2; // 0..1
    this.mesh.material.opacity = 0.55 + wave * 0.45;
    const scale = 1.0 + wave * 0.12;
    this.mesh.scale.set(scale, scale, 1);
  }

  dispose() {
    this._visible = false;
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
