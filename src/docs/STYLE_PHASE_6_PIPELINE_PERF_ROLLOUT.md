# Stylization — Phase 6: Asset Pipeline, Performance & Rollout

> **Source:** `STYLE_GUIDE.md` — "Asset Pipeline & Naming", "Performance & Testing", "Quick Checklist", and "Implementation Roadmap" sections
> **Depends on:** Phases 1–5 all functionally complete
> **Goal:** Close out the stylization pass — formalize naming/folders, profile the full pipeline end-to-end, and confirm the Style Guide's own "Quick Checklist (First Prototype)" is satisfied.

---

## Deliverables
- [x] Formalize asset folders per the Style Guide. **Decision:** no separate `assets/` staging area — the repo is small enough that the Style Guide's naming is applied directly inside the existing `public/textures/` folder, in a new `public/textures/bg/` subfolder for background art specifically. Vite serves `public/` as-is, so a staging→build copy step would be pure overhead here.
- [x] Apply naming convention retroactively to real assets: real background art landed this pass (a hand-painted cyberpunk city atlas, sliced into per-element files) and was named per `bg_<type>_<variant>_##`: `bg_skyline_purple_01`, `bg_skyline_blue_01`, `bg_building_facade_01`..`11`, `bg_signs_row1_01`..`row3_01`, plus `bg_ground_road_01` / `bg_accent_chevrons_01` / `bg_accent_neontubes_01` staged in `public/textures/bg/` but not yet wired into a system (candidates for a future Ground.js re-texture pass).
- [x] LOD guidance applied to Phase 4's background system: far/near layers stay single-quad planes; mid buildings are modular low-poly groups (base tower + rooftop/setback/fire-escape detail) but still capped by the segment-recycling pool, so no separate LOD tier was needed beyond that draw-call budget.
- [ ] Consistent pivot/orientation export convention documented for any new models added to `public/models/` — no new models landed this pass (only textures), so this stays open for whenever `public/models/` gets its first real asset.
- [ ] Full profiling pass with `src/core/PerformanceMonitor.js` across Phases 2–5 combined — not run yet; do this in-browser (`npm run dev`) since it needs an actual frame-timing session, not something to fake from source alone.
- [ ] Confirm `CONFIG.postProcessingEnabled` toggle (Phase 3) and the `PerformanceMonitor` auto-downgrade path both work under combined load — same as above, needs a live run.

### This pass: real background art replacing procedural placeholders
`ParallaxBackgroundSystem.js` previously used a solid-color far layer, flat-tinted boxes for mid buildings, and a procedurally-drawn canvas texture for near billboards (explicitly flagged in its own comments as "no texture asset for this yet"). That asset now exists, sliced and named per above, and all three layers were re-textured:
- **Far layer** — `MeshBasicMaterial` now maps the real skyline art (2 variants alternating) instead of a flat hex color.
- **Mid layer** — modular brutalist 3D towers (stacked boxes, setbacks, water tanks, fire escapes, antenna poles, roof neon trim) with real facade art mapped only to the camera-facing front face; emissive tint removed so the painted windows/signage read cleanly.
- **Near layer** — billboards now map real shop-sign art (JET CITY / BOOST / MIRAI etc., 3 row-variants) instead of the procedural scanline canvas; the per-frame scanline UV scroll was dropped since it doesn't make sense against non-tiling artwork, but the random flicker (dim blips) was kept.

## Style Guide's Own Checklist — Mapped to Phases
This project's `STYLE_GUIDE.md` ends with a "Quick Checklist (First Prototype)." Use it as the final acceptance gate, cross-referenced to where each item was actually implemented:

- [ ] Create palette and reference board → **Phase 1**
- [ ] Add 3 parallax BG layers → **Phase 4**
- [ ] Implement cel shader with 2-tone shading → **Phase 2**
- [ ] Add outline pass → **Phase 2**
- [ ] Add bloom + color grading presets → **Phase 3**
- [ ] Restyle one entity and one billboard asset → **Phase 2** (entity) + **Phase 4** (billboard)

If any box above isn't actually satisfied by the time Phase 6 starts, that's a signal to go back to the relevant phase rather than patch it in here — Phase 6 is verification, not new visual work.

## Testing Notes
- Test on both desktop and a throttled/low-end profile (Style Guide explicitly calls for a post-processing toggle for low-end devices — verify it's reachable, not just implemented).
- Re-run `tests/StormEncounter.test.mjs` (existing test) after all visual changes to confirm no gameplay-logic regressions snuck in through entity/material refactors.

## Explicitly Out of Scope
- Anything not already covered by Phases 1–5. This phase does not introduce new visual features — it only formalizes, profiles, and verifies them.
