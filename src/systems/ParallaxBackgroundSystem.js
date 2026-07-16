import * as THREE from 'three';
import { CONFIG, PALETTE } from '../utils/Constants.js';
import { createCelMaterial } from '../materials/CelMaterial.js';

// Depth (world z) for each layer. Gameplay entities (Bird/Pipe/Ground)
// all sit at z=0; the Storm encounter's decorative clouds/rain sit at
// z=-3/-1 (see CloudSystem.js/RainSystem.js). These three layers stack
// behind all of that, nearest to furthest.
const NEAR_Z = -4;
const MID_Z = -8;
const FAR_Z = -14;

const FAR_COUNT = 6;
const MID_COUNT = 5;
const NEAR_COUNT = 4;

const FAR_SEGMENT_WIDTH = 10;
const MID_SEGMENT_WIDTH = 7;
const NEAR_SEGMENT_WIDTH = 8;

// --- Shared procedural billboard texture (built once, reused by every billboard) ---
// A simple horizontal-bar "sign" pattern rather than real signage art -
// there's no texture asset for this yet (see STYLE_PHASE_4_BACKGROUNDS.md's
// "Asset Naming" note on assets/textures/ for when real art lands).
// Repeats vertically so animating texture.offset.y reads as a
// scrolling scanline across the sign.
let billboardTextureCache = null;
function getBillboardTexture() {
  if (billboardTextureCache) return billboardTextureCache;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff';
  for (let y = 0; y < size; y += 8) {
    ctx.fillRect(4, y, size - 8, 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 3);

  billboardTextureCache = texture;
  return billboardTextureCache;
}

/**
 * Stylization Phase 4 (see STYLE_PHASE_4_BACKGROUNDS.md).
 *
 * Three scrolling depth layers standing in for the old flat
 * sky-clear-color backdrop:
 *
 *   - Far skyline: flat silhouette cards in the palette's
 *     deepPurple/duskBlue, the slowest layer - distant, unshaded.
 *   - Mid city blocks: boxy cel-shaded geometry (Phase 2 material),
 *     lower emissive intensity than the near layer.
 *   - Near billboards: animated neon signs (scrolling-scanline UV +
 *     flicker), each paired with a short-range THREE.PointLight so
 *     nearby entities pick up colored rim light as they pass - the
 *     payoff for Phase 2's fresnel rim-light shader hook.
 *
 * Atmospheric haze itself isn't new here - Phase 1 already set
 * SceneManager's fog color/density from PALETTE.background, so these
 * layers fade into the same haze gameplay already does, for free.
 *
 * Every layer reuses Ground.js's segment-recycling trick: a fixed pool
 * of meshes gets shifted back to the tail end once it scrolls off the
 * left edge, so an "endless" city costs a fixed, small number of draw
 * calls regardless of run length. Owned and updated the same way
 * ParticleSystem is - constructed once in Game.js, ticked every frame
 * update() is called with whatever speed Ground.update() is also
 * getting that frame, so parallax always tracks actual gameplay speed
 * (including mid-run difficulty speedups) without separate tuning.
 */
export class ParallaxBackgroundSystem {
  constructor(scene) {
    this.scene = scene;

    this._far = this._buildFarLayer();
    this._mid = this._buildMidLayer();
    this._near = this._buildNearLayer();
  }

  // --- Layer construction ---------------------------------------------------

  _buildFarLayer() {
    const segments = [];
    const colors = [PALETTE.background.deepPurple, PALETTE.background.duskBlue];

    for (let i = 0; i < FAR_COUNT; i++) {
      const height = 2.5 + Math.random() * 3.5;
      const geometry = new THREE.PlaneGeometry(FAR_SEGMENT_WIDTH * 0.9, height);
      // Flat silhouette - no lighting needed, it's meant to read as a
      // distant, featureless skyline shape rather than a shaded object.
      const material = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(i * FAR_SEGMENT_WIDTH, CONFIG.groundY + height / 2, FAR_Z);
      this.scene.add(mesh);
      segments.push(mesh);
    }

    return segments;
  }

  _buildMidLayer() {
    const segments = [];

    for (let i = 0; i < MID_COUNT; i++) {
      const height = 1.8 + Math.random() * 2.4;
      const geometry = new THREE.BoxGeometry(MID_SEGMENT_WIDTH * 0.75, height, 1.2);
      const material = createCelMaterial({
        color: PALETTE.neutral.warmGray,
        emissive: i % 2 === 0 ? PALETTE.neon.cyan : PALETTE.neon.magenta,
        emissiveIntensity: 0.12, // dimmer than the near billboards - reads as "further away"
        rimColor: PALETTE.neutral.charcoal, // subtle - shouldn't compete with the near layer's rim
        rimIntensity: 0.25,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(i * MID_SEGMENT_WIDTH, CONFIG.groundY + height / 2, MID_Z);
      this.scene.add(mesh);
      segments.push(mesh);
    }

    return segments;
  }

  _buildNearLayer() {
    const billboards = [];
    const neonColors = [PALETTE.neon.magenta, PALETTE.neon.cyan, PALETTE.neon.lime, PALETTE.neon.orange];

    for (let i = 0; i < NEAR_COUNT; i++) {
      const color = neonColors[i % neonColors.length];

      const material = createCelMaterial({
        color: 0x111014,
        map: getBillboardTexture(),
        emissive: color,
        emissiveIntensity: CONFIG.bgBillboardEmissiveIntensity,
        rimColor: color,
        rimIntensity: 0.6,
      });

      const geometry = new THREE.PlaneGeometry(1.6, 2.2);
      const mesh = new THREE.Mesh(geometry, material);

      const y = CONFIG.groundY + 1.1 + Math.random() * 1.6;
      mesh.position.set(i * NEAR_SEGMENT_WIDTH, y, NEAR_Z);
      this.scene.add(mesh);

      // Short-range so it only tints whatever's actually passing close
      // by (mostly the Bird), not the whole scene.
      const light = new THREE.PointLight(
        color,
        CONFIG.bgBillboardLightIntensity,
        CONFIG.bgBillboardLightRange,
        2
      );
      light.position.set(mesh.position.x, mesh.position.y, mesh.position.z + 1);
      this.scene.add(light);

      billboards.push({
        mesh,
        light,
        baseIntensity: CONFIG.bgBillboardLightIntensity,
        flickerTimer: Math.random() * CONFIG.bgBillboardFlickerInterval,
      });
    }

    return billboards;
  }

  // --- Per-frame update ------------------------------------------------------

  /**
   * @param {number} delta
   * @param {number} baseSpeed - the same speed value this frame's Ground.update() call is using (CONFIG.menuGroundSpeed / CONFIG.pipeSpeed / pipeSpawner.speed).
   */
  update(delta, baseSpeed) {
    this._scrollLayer(this._far, FAR_SEGMENT_WIDTH, FAR_COUNT, baseSpeed * CONFIG.bgFarScrollRatio, delta);
    this._scrollLayer(this._mid, MID_SEGMENT_WIDTH, MID_COUNT, baseSpeed * CONFIG.bgMidScrollRatio, delta);
    this._scrollBillboards(baseSpeed * CONFIG.bgNearScrollRatio, delta);
  }

  _scrollLayer(segments, segmentWidth, count, speed, delta) {
    const totalWidth = segmentWidth * count;
    for (const segment of segments) {
      segment.position.x -= speed * delta;
      if (segment.position.x <= -segmentWidth) {
        segment.position.x += totalWidth;
      }
    }
  }

  _scrollBillboards(speed, delta) {
    const totalWidth = NEAR_SEGMENT_WIDTH * NEAR_COUNT;

    for (const billboard of this._near) {
      billboard.mesh.position.x -= speed * delta;
      if (billboard.mesh.position.x <= -NEAR_SEGMENT_WIDTH) {
        billboard.mesh.position.x += totalWidth;
      }
      // The light rides along with its billboard rather than being
      // independently simulated.
      billboard.light.position.x = billboard.mesh.position.x;

      // Scrolling scanline.
      billboard.mesh.material.map.offset.y += delta * CONFIG.bgBillboardScrollSpeed;

      // Flicker: mostly steady, with occasional brief dim blips rather
      // than a smooth sine pulse, so it reads as an unreliable neon
      // sign instead of a slow, deliberate breathing glow. Each
      // billboard's timer is independently randomized so they don't
      // flicker in lockstep.
      billboard.flickerTimer -= delta;
      if (billboard.flickerTimer <= 0) {
        billboard.flickerTimer = CONFIG.bgBillboardFlickerInterval * (0.5 + Math.random());
        const flickerScale = Math.random() < 0.3 ? 0.4 + Math.random() * 0.3 : 1;
        billboard.mesh.material.emissiveIntensity = CONFIG.bgBillboardEmissiveIntensity * flickerScale;
        billboard.light.intensity = billboard.baseIntensity * flickerScale;
      }
    }
  }

  dispose() {
    for (const mesh of this._far) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    for (const mesh of this._mid) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    for (const billboard of this._near) {
      this.scene.remove(billboard.mesh);
      this.scene.remove(billboard.light);
      billboard.mesh.geometry.dispose();
      billboard.mesh.material.dispose();
    }
  }
}
