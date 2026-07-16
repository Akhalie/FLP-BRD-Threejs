# Stylization — Phase 2: Shaders & Materials

> **Source:** `STYLE_GUIDE.md` — "Shaders & Materials" + "Game Models / Entities" sections
> **Depends on:** Phase 1 (palette)
> **Goal:** Give the game its cel-shaded look — quantized shading bands, rim light, and outlines — as a reusable material/pass that any entity can opt into.

---

## Deliverables
- [ ] `src/materials/CelMaterial.js` — a thin wrapper around `THREE.ShaderMaterial` (or `MeshToonMaterial` + custom gradient map, whichever proves cheaper) implementing 2–3 band quantized diffuse + a rim-light term.
- [ ] `src/materials/OutlinePass.js` (or inflated-mesh outline helper) — object-space outline via a backface-culled, slightly-scaled duplicate mesh with a flat unlit color material.
- [ ] Emissive support wired through `CelMaterial` so neon accents (panels, eyes, trims) can glow.

## Approach: Two Outline Options (pick one, don't build both)
1. **Inflated-mesh outline (cheaper, recommended first):** clone each entity's geometry, render backface-only, scaled ~1.02–1.05 along vertex normals, flat black/dark material, rendered before the main mesh. Works per-object, no full-screen pass needed — fits this project's existing "no post-processing by default" renderer (`RendererManager.js` currently renders straight to canvas).
2. **Post-process Sobel edge (Phase 3 territory):** only worth adding once `EffectComposer` is introduced in Phase 3. Note this instead of building it now to avoid a second render-target setup before Phase 3 exists.

Phase 2 implements **Option 1 only**. Sobel/edge-detection is deferred to Phase 3 alongside bloom, since both require `EffectComposer`.

## Cel Shading Model
- Quantize `NdotL` into 2–3 bands (e.g., shadow / mid / lit).
- Add a fresnel/rim term using `PALETTE.neon.*` so silhouettes read against dark backgrounds.
- Keep the shader cheap: this renders every entity (`Bird`, `Pipe`, `Dragon`, `Coin`, etc.) every frame — avoid per-fragment branching where a `step()`/`floor()` quantization works.

## Integration Points
| File | Change |
|---|---|
| `src/entities/Bird.js` | Swap whatever material it currently constructs for `CelMaterial`, add the inflated-outline child mesh. |
| `src/entities/Pipe.js` | Same swap; pipes use flat cel bands + outline, no rim (they're background geometry, not a "hero" silhouette). |
| `src/entities/Dragon.js`, `src/entities/Coin.js` | Same pattern — outline + cel material, emissive on any neon trim. |
| `src/materials/CelMaterial.js` (new) | Central material factory so entities don't each hand-roll shader code. |
| `src/materials/OutlinePass.js` (new) | Exposes `addOutline(mesh, color, scale)` used by each entity's constructor. |

## Acceptance Criteria
- Bird and pipes visibly show 2–3 tone banding instead of smooth PBR shading.
- A visible outline renders around Bird, Pipe, Dragon, Coin without a full-screen post-process pass.
- No frame-rate regression on the existing `PerformanceMonitor.js` budget — profile after wiring each entity, not just at the end.

## Explicitly Out of Scope for This Phase
- Bloom, LUT/color grading, Sobel post-process outline, grain, vignette — all Phase 3 (`EffectComposer` territory).
- Animated/scrolling emissive UVs for billboards — Phase 4.
