# Stylization — Phase 1: Palette & Color Foundations

> **Source:** `STYLE_GUIDE.md` — "Color & Palette" section
> **Goal:** Establish the JSR / Bomb Rush Cyberpunk color system as a single source of truth before touching any visuals, so every later phase (shaders, backgrounds, UI) pulls from the same swatches instead of inventing colors ad hoc.

---

## Why This Is Phase 1
Every other phase (cel-shading, backgrounds, UI, post-processing) needs colors. If palette work happens in parallel with those phases, colors drift. Locking the palette first means Phases 2–6 only ever *reference* it.

## Deliverables
- [ ] A `PALETTE` export added to `src/utils/Constants.js`, sitting next to the existing `CONFIG` object.
- [ ] 6–8 named swatches, grouped by role (primary neon, secondary neon, background, accent neutral).
- [ ] `CONFIG.skyColor` (currently used directly by `RendererManager`'s `setClearColor`) re-pointed at a palette background tone instead of a hardcoded hex.

## Palette Definition
```js
// src/utils/Constants.js
export const PALETTE = {
  neon: {
    magenta: 0xff2ec4,
    cyan:    0x2ef2ff,
    lime:    0xb6ff2e,
    orange:  0xff8a2e,
  },
  background: {
    deepPurple: 0x1a1030,
    duskBlue:   0x241a4a,
    horizon:    0x3a2a63,
  },
  neutral: {
    charcoal: 0x1c1c22,
    warmGray: 0x55505c,
  },
};
```

## Integration Points
| File | Change |
|---|---|
| `src/utils/Constants.js` | Add `PALETTE` export (above). Keep `CONFIG` untouched except `skyColor`. |
| `src/core/RendererManager.js` | `setClearColor(new THREE.Color(CONFIG.skyColor), 1)` → swap `CONFIG.skyColor` value to `PALETTE.background.deepPurple`. No code-shape change, just the constant it points to. |
| `src/systems/CloudSystem.js` | Cloud tint/fog colors pull from `PALETTE.background.*` instead of any existing literal hex. |

## Acceptance Criteria
- Grepping the codebase for raw hex colors (`0x` literals) outside `Constants.js` should trend toward zero over the following phases — Phase 1 just adds the table, it doesn't do the sweep yet (that happens naturally as Phases 2–6 touch each file).
- Game boots with the new background clear color and nothing else visually changes yet.

## Explicitly Out of Scope for This Phase
- Shader work (Phase 2).
- Any texture/material swaps (Phase 4).
- UI colors (Phase 5).
