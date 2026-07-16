# Stylization — Phase 4: Backgrounds & Parallax

> **Source:** `STYLE_GUIDE.md` — "Backgrounds (BG)" section
> **Depends on:** Phase 1 (palette), Phase 3 (bloom, since billboards/signs rely on emissive + bloom to read as neon)
> **Goal:** Layered parallax cityscape — far skyline, mid city blocks, near street-level props — replacing whatever background the game currently uses (currently just `CONFIG.skyColor` clear + `CloudSystem.js`).

---

## Deliverables
- [ ] `src/systems/ParallaxBackgroundSystem.js` (new, sibling to existing `CloudSystem.js`/`WindSystem.js`) managing 3 depth layers:
  - Far skyline — flat silhouette cards, `PALETTE.background.deepPurple`/`duskBlue`.
  - Mid city blocks — simple boxy geometry, cel-shaded (Phase 2 material), lower emissive intensity.
  - Near street-level props — highest detail/emissive layer, closest to camera.
- [ ] Billboard/sign entities with animated/scrolling UVs (scanline + flicker), using `CelMaterial`'s emissive channel from Phase 2.
- [ ] Atmospheric haze: a simple fog color gradient (`THREE.Fog`/`FogExp2` on `SceneManager`'s scene) tuned to `PALETTE.background.*`, not the current sky clear color alone.
- [ ] Local neon "light sources": point/rect lights positioned at billboard locations so nearby entities (Bird passing through) pick up colored rim light — this is the payoff for Phase 2's rim-light term.

## Integration Points
| File | Change |
|---|---|
| `src/systems/ParallaxBackgroundSystem.js` (new) | Owns the 3 layers, scroll speed per layer tied to existing game-speed values (reuse whatever `PipeSpawner.js` uses for scroll rate so parallax stays in sync with gameplay speed). |
| `src/core/SceneManager.js` | Register the new system alongside `CloudSystem`; add `THREE.Fog` using `PALETTE.background` tones. |
| `src/systems/CloudSystem.js` | Re-tint existing clouds to fit the palette rather than being replaced — clouds become one of the atmospheric layers, not deleted. |
| `src/utils/Constants.js` | Add layer scroll-speed ratios (far/mid/near) and billboard animation timing constants. |

## Asset Naming (per Style Guide's "Asset Pipeline & Naming")
- Billboards: `bg_billboard_neon_01`, `bg_billboard_neon_02`, ...
- Skyline cards: `bg_skyline_far_01`
- Mid-layer blocks: `bg_block_mid_01`
- Texture atlases for decals/signage live under `assets/textures/`; this phase should introduce that folder if it doesn't exist yet, per the Style Guide's pipeline section (`assets/models/`, `assets/textures/`, `assets/shaders/`, `assets/ui/`).

## Acceptance Criteria
- Three visually distinct depth layers scroll at different speeds (parallax is legible, not just decorative).
- At least one animated billboard (scrolling UV or flicker) visible during normal gameplay.
- Nearby neon light sources visibly tint the Bird's rim light as it passes.
- Frame budget re-checked via `PerformanceMonitor.js` — this phase adds the most draw calls of any phase so far.

## Explicitly Out of Scope for This Phase
- Restyling the Bird/Dragon/Pipe entities themselves (materials already came from Phase 2; this phase only adds *new* background objects).
- HUD/UI treatment — Phase 5.
