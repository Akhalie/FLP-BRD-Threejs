# Stylization — Phase 6: Asset Pipeline, Performance & Rollout

> **Source:** `STYLE_GUIDE.md` — "Asset Pipeline & Naming", "Performance & Testing", "Quick Checklist", and "Implementation Roadmap" sections
> **Depends on:** Phases 1–5 all functionally complete
> **Goal:** Close out the stylization pass — formalize naming/folders, profile the full pipeline end-to-end, and confirm the Style Guide's own "Quick Checklist (First Prototype)" is satisfied.

---

## Deliverables
- [ ] Formalize asset folders per the Style Guide: `assets/models/`, `assets/textures/`, `assets/shaders/`, `assets/ui/`. The repo currently has `public/models/` and `public/textures/` (both placeholder — only `.gitkeep` + two pipe textures exist today); decide whether `assets/` becomes a new source-side staging area feeding into `public/`, or whether the Style Guide's naming is simply applied inside the existing `public/` folders. Document the decision in this file once made — don't let it stay implicit.
- [ ] Apply naming convention retroactively to any assets touched in Phases 2–4: `entity_<name>_v1`, `bg_<type>_<variant>_##`, `mat_<descriptor>`.
- [ ] LOD guidance (high/medium/low) applied to any new geometry from Phase 4's background system — the parallax layers are the most likely place LODs matter (far-layer cards can be extremely cheap).
- [ ] Consistent pivot/orientation export convention documented for any new models added to `public/models/`.
- [ ] Full profiling pass with `src/core/PerformanceMonitor.js` across Phases 2–5 combined (cel materials + outlines + bloom/postfx + parallax backgrounds + UI), not just phase-by-phase in isolation.
- [ ] Confirm `CONFIG.postProcessingEnabled` toggle (Phase 3) and the `PerformanceMonitor` auto-downgrade path both work under combined load.

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
