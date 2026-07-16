# Stylization Plan — Jet Set Radio / Bomb Rush Cyberpunk

## Overview
A concise plan to shift the game's visual language toward a cel-shaded, neon-cyberpunk style inspired by Jet Set Radio and Bomb Rush Cyberpunk. Focus areas: backgrounds, game models (entities), materials/shaders, lighting/post-processing, and UI.

## Inspirations
- Jet Set Radio — bold cel-shading, thick outlines, vibrant neon palettes.
- Bomb Rush Cyberfunk — modernized urban cyberpunk with saturated glows, grain, and layered billboards.

## Visual Pillars
- Strong silhouettes and simplified forms.
- Flat/limited shading with bold rim/highlight accents.
- Neon emissive colors against desaturated mid/background tones.
- Stylized outlines (cel/edge lines) and halftone/dither textures.
- Motion-friendly details (animated signs, parallax layers).

## Color & Palette
- Primary neons: hot magenta, cyan, electric lime, neon orange.
- Backgrounds: desaturated blues/purples for depth.
- Accent neutrals: warm grays, charcoal for silhouettes.
- Prepare 6–8 palette swatches (primary, secondary, background, accent).

## Backgrounds (BG)
- Layered parallax: far skyline (silhouettes), mid city blocks, near street-level props.
- Billboards & signs: animated textures, looping shaders for scanlines & flicker.
- Graffiti/brushed decals: use atlases and parallax to convey scale.
- Atmospheric layers: subtle fog color gradients and volumetric-ish haze.
- Lighting: local neon sources that cast colored rim highlights on nearby models.

## Game Models / Entities
- Simplify meshes: focus on silhouette and readable shapes.
- Textures: hand-painted flat colors with small cel-gradients; avoid photo-real detail.
- Outlines: per-object outline pass (expanded geometry or post-edge detection).
- Emissive maps: for neon panels and accessories.
- Animation: exaggerate poses; add trailing smear or neon trails for fast motion.

## Shaders & Materials
- Cel-shader: quantized diffuse bands (2–3 levels) + rim lighting layer.
- Edge detection / outline: either object-space inflated outline or post-process Sobel edge.
- Emissive + bloom: high-emissive values feeding bloom; control with LOD to save perf.
- Dithering & halftone: subtle dither on gradients to sell stylization.
- Animated UVs: for scrolling billboards and scanline effects.

## Lighting & Post-Processing
- Bloom: medium radius, clamp to preserve silhouettes.
- Color grading / LUT: push blues/purples globally; punch neon saturation.
- Chromatic aberration: very subtle for screen edges.
- Film grain & vignette: light grain for texture and vignette for focus.
- Bloom + tone-map tuned to avoid blown-out UI elements.

## UI & HUD
- Holographic panels with neon outlines and glass blur.
- Pixel/retro type mixed with bold sans headings.
- Animated neon transitions (glow pulse, scanline slide-ins).
- Clear contrast between UI and world (use background dimming under overlays).

## Asset Pipeline & Naming
- Folders: `assets/models/`, `assets/textures/`, `assets/shaders/`, `assets/ui/`.
- Naming: `entity_dragon_v1`, `bg_billboard_neon_01`, `mat_cel_outlined`.
- Texture atlases for decals/signage; sprite sheets for simple animated signs.
- Export guidelines: consistent pivot/orientation; LODs: high/medium/low.

## Implementation Roadmap (first 2 sprints)
- Sprint 1 (2 weeks):
  - Gather references and finalize palette.
  - Implement BG parallax system and placeholder layers.
  - Add billboards with animated UVs.
  - Basic cel shader prototype and outline pass.
- Sprint 2 (2 weeks):
  - Restyle 3 core entities (player, main enemy, one prop).
  - Add emissive maps and bloom tuning.
  - Update UI to neon/holographic style.

## Performance & Testing
- Profile after each change; use LODs and atlas batching.
- Toggle post-processing for low-end devices.

## Quick Checklist (First Prototype)
- [ ] Create palette and reference board.
- [ ] Add 3 parallax BG layers.
- [ ] Implement cel shader with 2-tone shading.
- [ ] Add outline pass.
- [ ] Add bloom + color grading presets.
- [ ] Restyle one entity and one billboard asset.

## References & Resources
- Study Jet Set Radio screenshots and trailers.
- Review Bomb Rush Cyberfunk visuals for modern techniques.
- Shader references: cel-shading, Sobel edge, emissive bloom.

---

If you want, I can:
- produce a small sample shader and demo scene, or
- start restyling one entity and one background layer now.
