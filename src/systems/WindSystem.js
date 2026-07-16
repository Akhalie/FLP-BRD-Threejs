import * as THREE from 'three';
import { CONFIG } from '../utils/Constants.js';

const UPDRAFT_COLOR = 0x6fd6ff; // cool blue - "warm air rises" (docs/storm.md's "Updraft" section)
const DOWNDRAFT_COLOR = 0xff7a4d; // warm red/orange - "cold air crashes downward" (docs/storm.md's "Downdraft" section)

/**
 * Controls every wind zone during the Storm encounter (docs/storm.md's
 * "Wind Zones" / "Updraft" / "Downdraft" sections).
 *
 * Wind never directly changes the bird's velocity - instead it
 * temporarily overrides `bird.externalGravity` each frame, so Bird
 * stays the single owner of all movement physics and this class only
 * ever decides *what* gravity should be, never applies it itself.
 *
 * Each zone also owns a visible column (a tinted vertical beam plus a
 * few chevron arrows that scroll in the flow direction) so the player
 * can tell an updraft from a downdraft before flying into it, instead
 * of only finding out from how the bird starts moving.
 */
export class WindSystem {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;
    this.windZones = [];
  }

  /** Scatters CONFIG.stormWindZoneCount zones across the play area, each randomly an updraft or downdraft, each with its own visual column. */
  start() {
    this.windZones = [];

    for (let i = 0; i < CONFIG.stormWindZoneCount; i++) {
      const zone = {
        x: 6 + Math.random() * 8,
        width: CONFIG.stormWindZoneWidth,
        gravity: 0,
        speed: CONFIG.stormWindZoneSpeed,
        visual: this._createVisual(),
      };
      this._rollDirection(zone);
      this.windZones.push(zone);
    }
  }

  /** Builds one zone's column: a translucent tinted beam plus a handful of chevrons that scroll to show flow direction. */
  _createVisual() {
    const group = new THREE.Group();
    group.visible = false;

    const beamHeight = CONFIG.ceilingY - CONFIG.groundY + CONFIG.stormWindBeamMargin * 2;
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: UPDRAFT_COLOR,
      transparent: true,
      opacity: CONFIG.stormWindBeamOpacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.stormWindZoneWidth * 2, beamHeight), beamMaterial);
    beam.position.set(0, (CONFIG.ceilingY + CONFIG.groundY) / 2, -0.5);
    group.add(beam);

    const chevronMaterial = new THREE.MeshBasicMaterial({
      color: UPDRAFT_COLOR,
      transparent: true,
      opacity: CONFIG.stormWindChevronOpacity,
      depthWrite: false,
    });
    const chevrons = [];
    for (let i = 0; i < CONFIG.stormWindChevronCount; i++) {
      const chevron = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 3), chevronMaterial.clone());
      chevron.position.set(0, 0, -0.4);
      group.add(chevron);
      chevrons.push(chevron);
    }

    this.scene.add(group);
    return { group, beam, chevrons, scroll: 0 };
  }

  /** Re-rolls a zone's direction (used on spawn and every time a zone recycles) and re-tints its visual to match. */
  _rollDirection(zone) {
    const isUpdraft = Math.random() > 0.5;
    zone.gravity = isUpdraft ? CONFIG.stormUpdraftForce : CONFIG.stormDowndraftForce;

    const color = isUpdraft ? UPDRAFT_COLOR : DOWNDRAFT_COLOR;
    zone.visual.beam.material.color.setHex(color);
    // Chevrons point the way the wind flows: apex up for an updraft, apex down for a downdraft.
    const apexRotation = isUpdraft ? 0 : Math.PI;
    for (const chevron of zone.visual.chevrons) {
      chevron.material.color.setHex(color);
      chevron.rotation.z = apexRotation;
    }
  }

  /** Called once when the encounter's ACTIVE phase begins - zones exist from start() but don't push the bird (or show themselves) until this fires. */
  enable() {
    this.enabled = true;
    for (const zone of this.windZones) zone.visual.group.visible = true;
  }

  /** Called on victory so no zone can still be shoving the bird around (or shown as a threat) during the outro. */
  disable() {
    this.enabled = false;
    for (const zone of this.windZones) zone.visual.group.visible = false;
  }

  /** Scrolls every zone leftward, recycling it (with a freshly re-rolled updraft/downdraft) once it scrolls off-screen; animates each zone's flow arrows. */
  update(delta) {
    if (!this.enabled) return;

    for (const zone of this.windZones) {
      zone.x -= zone.speed * delta;
      if (zone.x < -10) {
        zone.x = 14;
        this._rollDirection(zone);
      }

      zone.visual.group.position.x = zone.x;
      this._updateChevrons(zone, delta);
    }
  }

  /** Slides each chevron along the column in its flow direction, wrapping back around so the scroll never stops or resets visibly. */
  _updateChevrons(zone, delta) {
    const rising = zone.gravity > 0;
    const bandBottom = CONFIG.groundY;
    const bandTop = CONFIG.ceilingY;
    const bandHeight = bandTop - bandBottom;

    zone.visual.scroll += (rising ? 1 : -1) * CONFIG.stormWindChevronSpeed * delta;

    const count = zone.visual.chevrons.length;
    for (let i = 0; i < count; i++) {
      const spacing = bandHeight / count;
      let y = bandBottom + ((i * spacing + zone.visual.scroll) % bandHeight + bandHeight) % bandHeight;
      zone.visual.chevrons[i].position.y = y;
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
    for (const zone of this.windZones) {
      this.scene.remove(zone.visual.group);
      zone.visual.beam.geometry.dispose();
      zone.visual.beam.material.dispose();
      for (const chevron of zone.visual.chevrons) {
        chevron.geometry.dispose();
        chevron.material.dispose();
      }
    }
    this.windZones.length = 0;
  }
}
