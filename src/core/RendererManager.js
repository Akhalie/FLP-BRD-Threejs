import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

/**
 * Wraps THREE.WebGLRenderer.
 *
 * The retro look comes from deliberately rendering at a low internal
 * resolution (starting at CONFIG.renderResolutionScale) while the
 * <canvas> element is stretched to fill the screen via CSS. Combined
 * with `image-rendering: pixelated` in styles.css, this produces the
 * chunky, blocky pixel look of PS1/N64-era 3D instead of smooth modern
 * output.
 *
 * Phase 4: the scale is no longer fixed - PerformanceMonitor calls
 * `setResolutionScale()` at runtime to trade resolution for frame rate
 * on slower devices, clamped between CONFIG.minResolutionScale and
 * CONFIG.maxResolutionScale so it never goes native-res (breaking the
 * art style) or so low it becomes illegible.
 */
export class RendererManager {
  constructor(canvas) {
    this.canvas = canvas;
    this._resolutionScale = CONFIG.renderResolutionScale;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // retro rendering wants hard edges, not smoothing
      alpha: false,
      powerPreference: 'high-performance',
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.pixelRatioCap));
    this.renderer.setClearColor(new THREE.Color(CONFIG.skyColor), 1);
    this.renderer.shadowMap.enabled = false; // keep it simple/cheap for now

    this._resizeToWindow();
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
    const width = Math.max(1, Math.floor(window.innerWidth * this._resolutionScale));
    const height = Math.max(1, Math.floor(window.innerHeight * this._resolutionScale));

    // `false` as the 3rd arg stops three.js from also setting canvas
    // CSS width/height inline - we control that entirely via styles.css
    // so the canvas always fills its parent regardless of internal res.
    this.renderer.setSize(width, height, false);

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
