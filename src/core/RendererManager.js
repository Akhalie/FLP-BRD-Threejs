import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CONFIG } from '../utils/Constants.js';
import { createGradePass } from '../materials/GradePass.js';

/**
 * Wraps THREE.WebGLRenderer.
 *
 * The retro look comes from deliberately rendering at a low internal
 * resolution (starting at CONFIG.renderResolutionScale) while the
 * <canvas> element is stretched to fill the screen via CSS.
 *
 * Stylization Phase 3 (see STYLE_PHASE_3_LIGHTING_POSTFX.md): an
 * optional THREE.EffectComposer chain - RenderPass -> UnrealBloomPass
 * -> GradePass (color grade/vignette/grain/aberration) -> OutputPass -
 * sits on top of the old direct render, gated by
 * CONFIG.postProcessingEnabled. It's built lazily on the first
 * render() call, once a scene/camera actually exist to hand
 * RenderPass; Game.js never replaces sceneManager.scene or
 * cameraManager.camera afterward, so there's nothing to rebuild once
 * it exists. postProcessingEnabled is read live (plus an optional
 * override - see setPostProcessingEnabled), so toggling it returns to
 * Phase 2's plain renderer.render() path immediately, no errors either
 * direction. The UI is a separate DOM overlay, not part of this
 * canvas, so it's already outside the composer with no extra work.
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

    // Composer is built lazily by _setupComposer() on the first
    // render() call - see class doc comment.
    this.composer = null;
    this.bloomPass = null;
    this.gradePass = null;

    // null = follow CONFIG.postProcessingEnabled live; true/false once
    // PerformanceMonitor has forced an explicit state (see
    // setPostProcessingEnabled).
    this._postFXOverride = null;
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

  /**
   * PerformanceMonitor's last-resort lever, once render resolution is
   * already at its floor and frames are still too slow. Pass `null`
   * to clear the override and go back to following
   * CONFIG.postProcessingEnabled.
   */
  setPostProcessingEnabled(enabled) {
    this._postFXOverride = enabled;
  }

  /** Effective state this frame - override if PerformanceMonitor has set one, otherwise CONFIG's live flag. */
  isPostProcessingEnabled() {
    return this._postFXOverride !== null ? this._postFXOverride : CONFIG.postProcessingEnabled;
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

    if (this.composer) {
      this.composer.setSize(width, height);
    }

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

  /**
   * Builds the composer chain the first time it's needed. scene/camera
   * are fixed instances for the whole game (see class doc comment),
   * so RenderPass never needs its .scene/.camera swapped afterward.
   */
  _setupComposer(scene, camera) {
    const size = new THREE.Vector2();
    this.renderer.getSize(size);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      CONFIG.bloomStrength,
      CONFIG.bloomRadius,
      CONFIG.bloomThreshold
    );
    this.composer.addPass(this.bloomPass);

    this.gradePass = createGradePass();
    this.composer.addPass(this.gradePass);

    // EffectComposer renders every intermediate pass to an offscreen
    // render target and skips the sRGB conversion renderer.render()
    // normally does for free on the way to the canvas - without this
    // final pass the image comes out washed out/desaturated compared
    // to Phase 1/2's direct-render look.
    this.composer.addPass(new OutputPass());
  }

  /** @param {number} [delta] - seconds since last frame, used to animate GradePass's film grain. */
  render(scene, camera, delta = 0) {
    if (!this.isPostProcessingEnabled()) {
      this.renderer.render(scene, camera);
      return;
    }

    if (!this.composer) {
      this._setupComposer(scene, camera);
    }

    if (this.gradePass) {
      this.gradePass.uniforms.uTime.value += delta;
    }

    this.composer.render();
  }

  dispose() {
    if (this.composer) this.composer.dispose();
    this.renderer.dispose();
  }
}
