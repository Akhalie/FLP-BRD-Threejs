# Stylization — Phase 5: UI & HUD

> **Source:** `STYLE_GUIDE.md` — "UI & HUD" section
> **Depends on:** Phase 1 (palette). Independent of Phases 2–4's 3D work — can be built in parallel by a different contributor since it's mostly CSS/DOM, not Three.js.
> **Goal:** Holographic neon panels, retro/bold type pairing, and animated transitions across every screen: `Hud`, `MainMenu`, `PauseOverlay`, `GameOverScreen`, `ShopScreen`.

---

## Deliverables
- [ ] `src/styles.css` updated with a neon/holographic design system: CSS custom properties mirroring `PALETTE` from Phase 1 (e.g., `--neon-magenta`, `--bg-deep-purple`) so JS and CSS colors never drift apart.
- [ ] Panel style: translucent glass background (`backdrop-filter: blur(...)`) + neon border/outline glow (`box-shadow` with palette colors).
- [ ] Typography pairing: a pixel/retro display font for headings/scores, a clean bold sans for body/instructions — loaded once, reused across all UI files.
- [ ] Animated transitions: glow-pulse keyframe for active elements, scanline slide-in for panel entrances/exits.
- [ ] Background dimming under overlays (`PauseOverlay`, `GameOverScreen`, `ShopScreen`) so 3D scene doesn't visually compete with UI contrast.

## Integration Points
| File | Change |
|---|---|
| `src/styles.css` | Add CSS custom properties + shared `.neon-panel`, `.neon-border`, `.glow-pulse`, `.scanline-in` utility classes. |
| `src/ui/Hud.js` | Score/status readouts adopt pixel/retro numerals + neon accent color per stat type. |
| `src/ui/MainMenu.js` | Title treatment gets the strongest neon glow (most visible screen); buttons get `.neon-panel`. |
| `src/ui/PauseOverlay.js`, `src/ui/GameOverScreen.js` | Background dimming + `.neon-panel` for the modal content. |
| `src/ui/ShopScreen.js` | Item cards become `.neon-panel` instances; rarity/selection state uses distinct palette neons (e.g., cyan = owned, magenta = selected). |
| `src/ui/WarningIndicator.js` | Encounter warnings (storm/dragon incoming) get a stronger pulse animation — this is a gameplay-critical readout, contrast must survive Phase 3's bloom/grade sitting behind it. |
| `src/ui/UIManager.js` | No structural change expected — it orchestrates screen visibility, not styling — but verify class names/hooks it references still match after the CSS rework. |

## Acceptance Criteria
- All five UI files render legibly against the neon-cyberpunk 3D background from Phases 3–4 (contrast check, not just aesthetic check).
- Colors in CSS trace back to the same palette source as Phase 1's `PALETTE` object — no separately-invented UI hex values.
- Panel entrance/exit uses the scanline/glow animation, not an instant show/hide.

## Explicitly Out of Scope for This Phase
- Any 3D/shader work — this phase is DOM/CSS only.
- Sound design changes (out of Style Guide scope entirely; not addressed in any phase).
