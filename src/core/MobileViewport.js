/**
 * Mobile ergonomics: fullscreen + landscape lock, gated to touch devices
 * only (desktop is untouched by any of this).
 *
 * Both the Fullscreen API and the Screen Orientation API's lock() require
 * an active user gesture - they reject if called from page load, a
 * promise callback, or anything not directly inside a click/tap handler.
 * So requestImmersiveMode() isn't called at boot; it's called from
 * Game.startGame(), which only ever runs as MainMenu's Play button's
 * click handler.
 *
 * Support is inconsistent enough that the lock is best-effort, not the
 * real fix: Chrome/Android generally allows orientation lock only while
 * actually in fullscreen; iPhone Safari has no Fullscreen API at all
 * (iPadOS does) and no Screen Orientation API either. initRotateOverlay()
 * is the actual fallback that guarantees a decent experience regardless -
 * a "rotate your device" prompt that shows any time a touch device is in
 * portrait, lock or no lock.
 */
export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

/** Best-effort fullscreen + landscape lock. Must be called synchronously from within a user gesture handler. No-op on desktop. */
export async function requestImmersiveMode() {
  if (!isTouchDevice()) return;

  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch {
    // Denied or unsupported (notably iPhone Safari) - the rotate
    // overlay below still gets the player into a playable orientation
    // even without fullscreen.
  }

  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch {
    // Same story - many browsers only allow this while in fullscreen,
    // and Safari doesn't implement the Screen Orientation API at all.
  }
}

/**
 * Inserts and wires up the "rotate your device" overlay: visible
 * whenever a touch device's viewport is in portrait, hidden otherwise.
 * Call once at boot - no gesture required, it's just a media query, and
 * it self-updates on rotation without any manual resize handling.
 */
export function initRotateOverlay() {
  if (!isTouchDevice()) return;

  const overlay = document.createElement('div');
  overlay.id = 'rotate-overlay';
  overlay.innerHTML = `
    <div class="rotate-overlay-content">
      <div class="rotate-overlay-icon">&#8635;</div>
      <p>Rotate your device to play</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const portraitQuery = window.matchMedia('(orientation: portrait)');
  const sync = () => overlay.classList.toggle('is-visible', portraitQuery.matches);
  portraitQuery.addEventListener('change', sync);
  sync();
}
