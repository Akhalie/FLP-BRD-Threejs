// Stylization Phase 5 (UI & HUD, see src/docs/STYLE_PHASE_5_UI_HUD.md):
// every overlay screen with a `.panel` (MainMenu, PauseOverlay,
// GameOverScreen, ShopScreen) routes show/hide through here so entrances
// and exits always play the scanline/glow reveal defined in styles.css
// (`.panel` entrance animation, `.screen.closing .panel` exit animation)
// instead of an instant `display: none` toggle.
//
// Must match --panel-exit-ms in styles.css.
const EXIT_MS = 180;

/**
 * Shows `root` and (re)plays the entrance animation. Safe to call while
 * a previous hide() is still mid-exit - it cancels that timer immediately.
 */
export function showScreen(root) {
  clearTimeout(root._closeTimer);
  root.classList.remove('closing');
  // Force a reflow so re-adding 'visible' after a very-recent removal
  // still restarts the CSS animation instead of silently no-op'ing.
  void root.offsetWidth;
  root.classList.add('visible');
}

/**
 * Hides `root`, but keeps it laid out (non-interactive) for EXIT_MS so
 * the panel's exit animation gets to play before it fully unmounts.
 */
export function hideScreen(root) {
  if (!root.classList.contains('visible') && !root.classList.contains('closing')) return;

  root.classList.add('closing');
  root.classList.remove('visible');

  clearTimeout(root._closeTimer);
  root._closeTimer = setTimeout(() => {
    root.classList.remove('closing');
  }, EXIT_MS);
}
