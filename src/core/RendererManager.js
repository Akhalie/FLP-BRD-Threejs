import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

/**
 * Wraps THREE.WebGLRenderer.
 *
 * The retro look comes from deliberately rendering at a low internal
 * resolution (starting at CONFIG.renderResolutionScale) while the
 * <canvas> element is stretched to fill the screen via CSS.
 */
export class RendererManager {
  constructor(canvas) {
    this.canvas = canvas;
    this._resolutionScale = CONFIG.renderResolutionScale;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, CONFIG.pixelRatioCap)
    );

    this.renderer.setClearColor(
      new THREE.Color(CONFIG.skyColor),
      1
    );

    this.renderer.shadowMap.enabled = false;

    this._resizeToWindow();

    // No post-processing by default; render directly to canvas.
  }

  /** Clamped to [minResolutionScale, maxResolutionScale]; re-applies size immediately. */
  setResolutionScale(scale) {
    const clamped = THREE.MathUtils.clamp(
      scale,
      CONFIG.minResolutionScale,
      CONFIG.maxResolutionScale
    );

    if (clamped === this._resolutionScale) return;

    this._resolutionScale = clamped;
    this._resizeToWindow();
  }

  getResolutionScale() {
    return this._resolutionScale;
  }

  _resizeToWindow() {
    const width = Math.max(
      1,
      Math.floor(window.innerWidth * this._resolutionScale)
    );

    const height = Math.max(
      1,
      Math.floor(window.innerHeight * this._resolutionScale)
    );

    this.renderer.setSize(width, height, false);

    // keep behavior simple: renderer size only

    return { width, height };
  }

  getAspect() {
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    return size.x / size.y;
  }

  onResize() {
    return this._resizeToWindow();
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}