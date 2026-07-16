# Stylization — Phase 3: Lighting & Post-Processing

> **Source:** `STYLE_GUIDE.md` — "Lighting & Post-Processing" section
> **Depends on:** Phase 1 (palette), Phase 2 (cel materials/outlines exist and are stable)
> **Goal:** Introduce a post-processing pipeline (bloom, color grade, grain, vignette, subtle chromatic aberration) without breaking the project's current "render straight to canvas, no `EffectComposer`" setup.

---

## Why This Is Its Own Phase
`RendererManager.js` currently renders directly (`this.renderer.render(scene, camera)`), explicitly noting "No post-processing by default." This phase is the one place that assumption changes, so it's isolated from Phase 2's per-material work to make the risk (perf, render-target management) easy to profile and roll back independently.

## Deliverables
- [ ] Introduce `THREE.EffectComposer` inside `RendererManager.js`, gated behind a `CONFIG.postProcessingEnabled` flag (default on for desktop, easy to flip off for low-end devices per the Style Guide's "Performance & Testing" note).
- [ ] `RenderPass` → `UnrealBloomPass` (tuned to medium radius, clamped threshold so it doesn't wash out silhouettes) → color-grade pass (simple LUT or a lightweight custom shader pass pushing blues/purples + neon saturation from `PALETTE`) → optional grain/vignette pass.
- [ ] Chromatic aberration kept extremely subtle (screen-edge only) or skipped entirely if it costs more than it's worth — Style Guide explicitly calls it out as "very subtle."

## Integration Points
| File | Change |
|---|---|
| `src/core/RendererManager.js` | Add composer setup alongside existing `WebGLRenderer` construction; `render()` calls `composer.render()` when enabled, falls back to direct render otherwise. `_resizeToWindow()` must also resize the composer's render targets. |
| `src/utils/Constants.js` | Add `CONFIG.postProcessingEnabled` and bloom tuning constants (`bloomStrength`, `bloomRadius`, `bloomThreshold`). |
| `src/core/PerformanceMonitor.js` | Hook into the existing perf monitor so it can toggle `postProcessingEnabled` off automatically if frame budget is exceeded — matches Style Guide's "toggle post-processing for low-end devices." |

## Acceptance Criteria
- Neon emissive materials from Phase 2 visibly bloom.
- Toggling `CONFIG.postProcessingEnabled = false` returns the game to Phase 2's direct-render look with no errors.
- Resize (window resize / resolution scale change, both already handled in `RendererManager._resizeToWindow`) doesn't break the composer's render targets.
- UI/HUD (still un-styled until Phase 5) is *not* run through bloom/grade — composer should exclude the UI layer, or UI must render after the composer pass.

## Explicitly Out of Scope for This Phase
- Sobel-based post-process outlines (mentioned as an alternative outline technique in the Style Guide) — Phase 2's inflated-mesh outline is the chosen approach; revisit only if Phase 2's outline proves visually insufficient.
- Background parallax/billboard content — Phase 4.
