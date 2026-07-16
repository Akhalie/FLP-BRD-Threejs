import { CONFIG } from '../utils/Constants.js';

/**
 * Controls every wind zone during the Storm encounter (docs/storm.md's
 * "Wind Zones" / "Updraft" / "Downdraft" sections).
 *
 * Wind never directly changes the bird's velocity - instead it
 * temporarily overrides `bird.externalGravity` each frame, so Bird
 * stays the single owner of all movement physics and this class only
 * ever decides *what* gravity should be, never applies it itself.
 */
export class WindSystem {
  constructor() {
    this.enabled = false;
    this.windZones = [];
  }

  /** Scatters CONFIG.stormWindZoneCount zones across the play area, each randomly an updraft or downdraft. */
  start() {
    this.windZones = [];

    for (let i = 0; i < CONFIG.stormWindZoneCount; i++) {
      this.windZones.push({
        x: 6 + Math.random() * 8,
        width: CONFIG.stormWindZoneWidth,
        gravity: Math.random() > 0.5 ? CONFIG.stormUpdraftForce : CONFIG.stormDowndraftForce,
        speed: CONFIG.stormWindZoneSpeed,
      });
    }
  }

  /** Called once when the encounter's ACTIVE phase begins - zones exist from start() but don't push the bird until this fires. */
  enable() {
    this.enabled = true;
  }

  /** Called on victory so no zone can still be shoving the bird around during the outro. */
  disable() {
    this.enabled = false;
  }

  /** Scrolls every zone leftward, recycling it (with a freshly re-rolled updraft/downdraft) once it scrolls off-screen. */
  update(delta) {
    if (!this.enabled) return;

    for (const zone of this.windZones) {
      zone.x -= zone.speed * delta;
      if (zone.x < -10) {
        zone.x = 14;
        zone.gravity = Math.random() > 0.5 ? CONFIG.stormUpdraftForce : CONFIG.stormDowndraftForce;
      }
    }
  }

  /** Sets bird.externalGravity for this frame - 0 outside any zone, otherwise the zone's up/downdraft force, scaled. */
  applyToBird(bird) {
    bird.externalGravity = 0;
    if (!this.enabled) return;

    const x = bird.getPosition().x;
    for (const zone of this.windZones) {
      if (Math.abs(x - zone.x) <= zone.width) {
        bird.externalGravity = zone.gravity * CONFIG.stormWindInfluenceScale;
        return;
      }
    }
  }

  dispose() {
    this.windZones.length = 0;
  }
}
