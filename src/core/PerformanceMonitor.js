import { CONFIG } from '../utils/Constants.js';

/**
 * Watches frame time and automatically trades resolution for frame
 * rate (or back) via RendererManager.setResolutionScale(). This is
 * what keeps the game playable on slower/mobile GPUs without a manual
 * quality menu - there's nothing else for the player to configure.
 *
 * Deliberately simple: average FPS over a rolling window, and only
 * act once every `perfAdjustCooldown` seconds so a single rough frame
 * (GC pause, tab switch) can't cause visible resolution flicker.
 */
export class PerformanceMonitor {
  constructor(rendererManager) {
    this.rendererManager = rendererManager;

    this._windowTime = 0;
    this._windowFrames = 0;
    this._avgFps = 60;
    this._cooldown = 0;
  }

  /** Call once per frame with the same delta the game loop uses. */
  update(delta) {
    this._cooldown = Math.max(0, this._cooldown - delta);

    this._windowTime += delta;
    this._windowFrames += 1;

    if (this._windowTime < CONFIG.perfSampleWindow) return;

    this._avgFps = this._windowFrames / this._windowTime;
    this._windowTime = 0;
    this._windowFrames = 0;

    if (this._cooldown > 0) return;

    const currentScale = this.rendererManager.getResolutionScale();

    if (this._avgFps < CONFIG.perfMinFps && currentScale > CONFIG.minResolutionScale) {
      this.rendererManager.setResolutionScale(currentScale - CONFIG.perfScaleStep);
      this._cooldown = CONFIG.perfAdjustCooldown;
    } else if (this._avgFps >= CONFIG.perfGoodFps && currentScale < CONFIG.maxResolutionScale) {
      this.rendererManager.setResolutionScale(currentScale + CONFIG.perfScaleStep);
      this._cooldown = CONFIG.perfAdjustCooldown;
    }
  }

  get averageFps() {
    return this._avgFps;
  }
}
