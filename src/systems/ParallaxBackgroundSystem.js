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
const MID_COUNT = 7;
const NEAR_COUNT = 4;

const FAR_SEGMENT_WIDTH = 10;
const MID_SEGMENT_WIDTH = 7;
const MID_SEGMENT_VARIANCE = 0.24;
// Match mid-layer spacing so neon signs start over building facades, not
// the gaps between them (they still drift apart via parallax scroll ratios).
const NEAR_SEGMENT_WIDTH = MID_SEGMENT_WIDTH;

// --- Real art assets (Phase 6: real texture atlas replaces the old procedural placeholders) ---
// Source: a hand-painted cyberpunk city atlas, sliced into per-element
// files following the Style Guide's `bg_<type>_<variant>_##` convention.
// Naming/placement decision (STYLE_PHASE_6_PIPELINE_PERF_ROLLOUT.md): assets
// live directly under public/textures/bg/ - no separate assets/ staging
// folder - since Vite already serves public/ as-is and this is a small
// single-repo project.
const textureLoader = new THREE.TextureLoader();

function loadArt(url) {
  const texture = textureLoader.load(url);
  // Pixel-art source: keep it crisp rather than letting trilinear
  // filtering smear it into a blur (the retro low-res render pass
  // already does the "chunky pixel" look - this just stops these
  // specific textures fighting it).
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const SKYLINE_TEXTURES = [
  { texture: loadArt('/textures/bg/bg_skyline_purple_01.png'), aspect: 646 / 156 },
  { texture: loadArt('/textures/bg/bg_skyline_blue_01.png'), aspect: 573 / 156 },
];

const BUILDING_COUNT = 11;
const BUILDING_TEXTURES = Array.from({ length: BUILDING_COUNT }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return loadArt(`/textures/bg/bg_building_facade_${n}.png`);
});
// Facades were cropped at varying widths; approximate aspect per tile keeps
// them from looking stretched without needing per-tile UV metadata.
const BUILDING_ASPECTS = [113, 106, 115, 118, 114, 112, 116, 135, 108, 95, 99].map((w) => w / 182);

const BUILDING_DEPTH = 1.35;

const NEON_ACCENTS = [
  PALETTE.neon.cyan,
  PALETTE.neon.magenta,
  PALETTE.neon.lime,
  PALETTE.neon.orange,
];

// Shared cel materials for modular mid-layer geometry (sides, rooftops,
// fire escapes, tanks, etc.). Only the camera-facing facade face gets
// the painted texture map — everything else reads as brutalist concrete.
const buildingSideMaterial = createCelMaterial({
  color: PALETTE.neutral.charcoal,
  rimColor: PALETTE.neutral.charcoal,
  rimIntensity: 0.15,
});
const buildingRooftopMaterial = createCelMaterial({
  color: 0x2a2838,
  rimColor: PALETTE.neutral.charcoal,
  rimIntensity: 0.1,
});
const buildingConcreteMaterial = createCelMaterial({
  color: PALETTE.neutral.warmGray,
  rimColor: PALETTE.neutral.charcoal,
  rimIntensity: 0.15,
});
const buildingTankMaterial = createCelMaterial({
  color: 0x3a3a48,
  rimColor: PALETTE.neutral.charcoal,
  rimIntensity: 0.12,
});
const buildingPoleMaterial = createCelMaterial({
  color: 0x222228,
  rimColor: PALETTE.neutral.charcoal,
  rimIntensity: 0.1,
});

const accentMaterialCache = new Map();
function getAccentMaterial(color) {
  if (!accentMaterialCache.has(color)) {
    accentMaterialCache.set(
      color,
      createCelMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.55,
        rimColor: color,
        rimIntensity: 0.35,
      })
    );
  }
  return accentMaterialCache.get(color);
}

const BUILDING_ARCHETYPE_COUNT = 11;

function createFacadeMaterial(tex) {
  return createCelMaterial({
    color: 0xffffff,
    map: tex,
    emissive: 0x000000,
    emissiveIntensity: 0,
    rimColor: PALETTE.neutral.charcoal,
    rimIntensity: 0.2,
  });
}

function createFacadeMesh(width, height, depth, frontMaterial) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), [
    buildingSideMaterial,
    buildingSideMaterial,
    buildingRooftopMaterial,
    buildingSideMaterial,
    frontMaterial,
    buildingSideMaterial,
  ]);
  mesh.position.y = height / 2;
  return mesh;
}

function addBox(group, width, height, depth, x, y, z, material = buildingConcreteMaterial) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  return mesh;
}

function addWaterTank(group, radius, tankHeight, x, y, z) {
  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, tankHeight, 8),
    buildingTankMaterial
  );
  tank.position.set(x, y, z);
  group.add(tank);
}

function addAntenna(group, poleHeight, poleWidth, x, y, accent) {
  addBox(group, poleWidth, poleHeight, poleWidth, x, y + poleHeight / 2, 0, buildingPoleMaterial);
  const tipR = poleWidth * 0.9;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(tipR, 6, 6), getAccentMaterial(accent));
  tip.position.set(x, y + poleHeight + tipR, 0);
  group.add(tip);
}

function addFireEscape(group, width, height, depth, side = -1) {
  const landings = 4;
  const edgeX = side * (width / 2 + width * 0.06);
  for (let i = 0; i < landings; i++) {
    const ly = height * (0.18 + i * 0.17);
    addBox(
      group,
      width * 0.16,
      height * 0.026,
      depth * 0.5,
      edgeX,
      ly,
      depth * 0.06,
      buildingSideMaterial
    );
    if (i < landings - 1) {
      const stair = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.04, height * 0.15, depth * 0.3),
        buildingPoleMaterial
      );
      stair.position.set(edgeX - side * width * 0.07, ly + height * 0.085, depth * 0.03);
      stair.rotation.z = side * 0.42;
      group.add(stair);
    }
  }
}

function addNeonTrim(group, width, height, depth, accent, y) {
  addBox(
    group,
    width * 0.88,
    height * 0.016,
    depth * 0.05,
    0,
    y,
    depth / 2 + depth * 0.035,
    getAccentMaterial(accent)
  );
}

/** @returns {{ group: THREE.Group, frontMaterial: THREE.Material, height: number }} */
function buildSlimSpire(group, frontMaterial, width, height, depth, accent) {
  group.add(createFacadeMesh(width, height, depth, frontMaterial));
  addAntenna(group, height * 0.22, width * 0.03, width * 0.34, height, accent);
  return { height };
}

function buildWidePodium(group, frontMaterial, width, height, depth, accent) {
  group.add(createFacadeMesh(width, height, depth, frontMaterial));
  addBox(group, width * 0.42, height * 0.04, depth * 0.48, -width * 0.12, height * 0.1, depth / 2 + depth * 0.2);
  addBox(group, width * 0.36, height * 0.22, depth * 0.34, width * 0.2, height * 0.42, depth / 2 + depth * 0.16);
  addBox(group, width * 0.36, height * 0.22, depth * 0.34, -width * 0.22, height * 0.58, depth / 2 + depth * 0.12);
  addWaterTank(group, width * 0.09, height * 0.06, width * 0.3, height + height * 0.04, -depth * 0.1);
  return { height };
}

function buildStepZiggurat(group, frontMaterial, width, height, depth) {
  const towerH = height * 0.68;
  group.add(createFacadeMesh(width, towerH, depth, frontMaterial));
  let topY = towerH;
  for (let tier = 0; tier < 3; tier++) {
    const tierW = width * (0.78 - tier * 0.16);
    const tierH = height * 0.1;
    addBox(group, tierW, tierH, depth * 0.86, 0, topY + tierH / 2, -depth * 0.05 * tier);
    topY += tierH;
  }
  return { height: topY };
}

function buildTwinBlock(group, frontMaterial, width, height, depth, accent) {
  const coreW = width * 0.72;
  group.add(createFacadeMesh(coreW, height, depth, frontMaterial));
  addBox(group, width * 0.2, height * 0.72, depth * 0.75, -width * 0.36, height * 0.36, -depth * 0.06);
  addBox(group, width * 0.2, height * 0.55, depth * 0.7, width * 0.36, height * 0.28, -depth * 0.04);
  addNeonTrim(group, coreW, height, depth, accent, height * 0.97);
  return { height };
}

function buildLWing(group, frontMaterial, width, height, depth) {
  group.add(createFacadeMesh(width * 0.78, height, depth, frontMaterial));
  const wingW = width * 0.48;
  const wingH = height * 0.38;
  addBox(group, wingW, wingH, depth * 0.9, -width * 0.52, wingH / 2, -depth * 0.04);
  addBox(group, width * 0.08, height * 0.55, depth * 0.08, -width * 0.52, height * 0.28, depth * 0.15);
  addWaterTank(group, width * 0.1, height * 0.07, width * 0.18, height + height * 0.04, 0);
  return { height };
}

function buildCantilever(group, frontMaterial, width, height, depth, accent) {
  group.add(createFacadeMesh(width, height, depth, frontMaterial));
  const loftH = height * 0.18;
  addBox(group, width * 0.82, loftH, depth * 0.55, 0, height + loftH / 2, depth * 0.22);
  addBox(group, width * 0.06, height * 0.45, depth * 0.06, width * 0.38, height * 0.55, depth * 0.08);
  addNeonTrim(group, width * 0.82, height + loftH, depth, accent, height + loftH - loftH * 0.05);
  return { height: height + loftH };
}

function buildFireEscapeTower(group, frontMaterial, width, height, depth) {
  group.add(createFacadeMesh(width, height, depth * 1.05, frontMaterial));
  addFireEscape(group, width, height, depth, -1);
  addBox(group, width * 0.14, height * 0.04, depth * 0.55, width * 0.34, height * 0.14, depth / 2 + depth * 0.22);
  return { height };
}

function buildIndustrialFlat(group, frontMaterial, width, height, depth) {
  group.add(createFacadeMesh(width, height, depth * 1.15, frontMaterial));
  for (let i = 0; i < 3; i++) {
    addWaterTank(
      group,
      width * 0.07,
      height * 0.055,
      (i - 1) * width * 0.22,
      height + height * 0.03,
      -depth * 0.08
    );
  }
  addBox(group, width * 0.05, height * 0.65, width * 0.05, width * 0.42, height * 0.33, depth / 2 + depth * 0.08);
  return { height };
}

function buildSetbackPenthouse(group, frontMaterial, width, height, depth, accent) {
  group.add(createFacadeMesh(width, height, depth, frontMaterial));
  const pentW = width * 0.48;
  const pentH = height * 0.2;
  addBox(group, pentW, pentH, depth * 0.8, width * 0.18, height + pentH / 2, -depth * 0.1);
  addAntenna(group, height * 0.12, width * 0.028, -width * 0.3, height + pentH, accent);
  addNeonTrim(group, pentW, height + pentH, depth, accent, height + pentH * 0.95);
  return { height: height + pentH };
}

function buildBeltTower(group, frontMaterial, width, height, depth) {
  const baseH = height * 0.72;
  group.add(createFacadeMesh(width, baseH, depth, frontMaterial));
  addBox(group, width * 1.02, height * 0.06, depth * 1.05, 0, baseH + height * 0.03, 0);
  const crownW = width * 0.42;
  const crownH = height * 0.22;
  addBox(group, crownW, crownH, depth * 0.7, 0, baseH + height * 0.06 + crownH / 2, -depth * 0.08);
  for (let ac = 0; ac < 2; ac++) {
    addBox(
      group,
      crownW * 0.35,
      height * 0.05,
      depth * 0.28,
      (ac - 0.5) * crownW * 0.45,
      baseH + height * 0.06 + crownH + height * 0.025,
      depth * 0.02,
      buildingSideMaterial
    );
  }
  return { height: baseH + height * 0.06 + crownH + height * 0.05 };
}

function buildMastTower(group, frontMaterial, width, height, depth, accent) {
  const baseH = height * 0.42;
  group.add(createFacadeMesh(width, baseH, depth * 1.1, frontMaterial));
  const mastH = height * 0.75;
  const mastW = width * 0.045;
  addBox(group, mastW, mastH, mastW, 0, baseH + mastH / 2, 0, buildingPoleMaterial);
  for (let ring = 0; ring < 3; ring++) {
    addBox(
      group,
      width * 0.18,
      height * 0.014,
      depth * 0.04,
      0,
      baseH + mastH * (0.25 + ring * 0.22),
      0,
      getAccentMaterial(accent)
    );
  }
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(width * 0.04, 6, 6),
    getAccentMaterial(accent)
  );
  tip.position.set(0, baseH + mastH + width * 0.04, 0);
  group.add(tip);
  return { height: baseH + mastH + width * 0.04 };
}

const BUILDING_ARCHETYPES = [
  // [widthScale, heightScale, depthScale, builder]
  { width: 0.58, height: 1.18, depth: 1.05, build: buildSlimSpire },
  { width: 0.98, height: 0.82, depth: 1.2, build: buildWidePodium },
  { width: 0.78, height: 1.05, depth: 0.95, build: buildStepZiggurat },
  { width: 0.88, height: 0.95, depth: 1.0, build: buildTwinBlock },
  { width: 0.72, height: 1.0, depth: 1.15, build: buildLWing },
  { width: 0.8, height: 0.92, depth: 1.05, build: buildCantilever },
  { width: 0.7, height: 1.08, depth: 1.0, build: buildFireEscapeTower },
  { width: 1.0, height: 0.76, depth: 1.25, build: buildIndustrialFlat },
  { width: 0.76, height: 1.0, depth: 0.92, build: buildSetbackPenthouse },
  { width: 0.84, height: 0.98, depth: 1.08, build: buildBeltTower },
  { width: 0.64, height: 1.12, depth: 0.88, build: buildMastTower },
];

/**
 * Build a low-poly brutalist building as a THREE.Group. Structure is picked
 * from BUILDING_ARCHETYPES (decoupled from the facade texture index) so
 * adjacent segments read as different buildings even when textures repeat.
 */
function createModularBuilding(texIndex, slotIndex, slotWidth = MID_SEGMENT_WIDTH) {
  const tex = BUILDING_TEXTURES[texIndex % BUILDING_COUNT];
  const aspect = BUILDING_ASPECTS[texIndex % BUILDING_ASPECTS.length];
  const archetypeIndex = (texIndex * 7 + slotIndex * 5) % BUILDING_ARCHETYPE_COUNT;
  const profile = BUILDING_ARCHETYPES[archetypeIndex];
  const accent = NEON_ACCENTS[(texIndex + slotIndex + archetypeIndex) % NEON_ACCENTS.length];

  // Give each slot a slightly different footprint so the skyline feels like
  // a real city block rather than a parade of identical facades.
  const width = slotWidth * (0.72 + (slotIndex % 4) * 0.06 + (slotIndex % 2) * 0.02);
  const heightScale = 0.78 + ((slotIndex + 2) % 4) * 0.08;
  const depthScale = 0.9 + ((slotIndex * 2 + 1) % 3) * 0.08;
  const height = (width / aspect) * profile.height * heightScale;
  const depth = BUILDING_DEPTH * profile.depth * depthScale;

  const group = new THREE.Group();
  const frontMaterial = createFacadeMaterial(tex);
  const result = profile.build(group, frontMaterial, width, height, depth, accent);

  if (slotIndex % 2 === 1) {
    group.scale.x = -1;
  }

  group.userData.height = result.height;
  group.userData.frontMaterial = frontMaterial;
  group.userData.width = width;
  group.userData.slotWidth = slotWidth;
  return group;
}

const SIGN_TEXTURES = [
  { texture: loadArt('/textures/bg/bg_signs_row1_01.png'), aspect: 553 / 92 }, // JET CITY / FLAP! / NEO TOKYO
  { texture: loadArt('/textures/bg/bg_signs_row2_01.png'), aspect: 553 / 91 }, // BOOST / cassette / RAD! / graffiti
  { texture: loadArt('/textures/bg/bg_signs_row3_01.png'), aspect: 553 / 83 }, // HOTEL / open / arrow / peace / glitch / MIRAI
];

/**
 * Stylization Phase 4 (see STYLE_PHASE_4_BACKGROUNDS.md), re-textured in
 * Phase 6 once real background art landed (STYLE_PHASE_6_PIPELINE_PERF_ROLLOUT.md).
 *
 * Three scrolling depth layers standing in for the old flat
 * sky-clear-color backdrop:
 *
 *   - Far skyline: unlit silhouette cards using the real skyline artwork,
 *     the slowest layer - distant, unshaded.
 *   - Mid city blocks: modular low-poly brutalist towers (stacked boxes,
 *     setbacks, water tanks, fire escapes, antenna poles) with real facade
 *     art mapped only to the camera-facing front face.
 *   - Near billboards: real neon shop-sign artwork (JET CITY / BOOST /
 *     MIRAI, etc.), each paired with a short-range THREE.PointLight so
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
 * calls regardless of run length (LOD note for Phase 6: far/near layers stay
 * single-quad planes; mid buildings are small modular groups but still
 * capped by the same segment-recycling pool, so no separate LOD tier).
 * same way ParticleSystem is - constructed once in Game.js, ticked
 * every frame update() is called with whatever speed Ground.update()
 * is also getting that frame, so parallax always tracks actual
 * gameplay speed (including mid-run difficulty speedups) without
 * separate tuning.
 */
export class ParallaxBackgroundSystem {
  constructor(scene) {
    this.scene = scene;

    this._far = this._buildFarLayer();
    this._mid = this._buildMidLayer();
    this._near = this._buildNearLayer(this._mid);
  }

  // --- Layer construction ---------------------------------------------------

  _buildFarLayer() {
    const segments = [];

    for (let i = 0; i < FAR_COUNT; i++) {
      const art = SKYLINE_TEXTURES[i % SKYLINE_TEXTURES.length];
      const height = FAR_SEGMENT_WIDTH / art.aspect;
      const geometry = new THREE.PlaneGeometry(FAR_SEGMENT_WIDTH, height);
      // Flat/unlit - it's meant to read as a distant, featureless skyline
      // silhouette rather than a shaded object.
      const material = new THREE.MeshBasicMaterial({ map: art.texture });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(i * FAR_SEGMENT_WIDTH, CONFIG.groundY + height / 2, FAR_Z);
      this.scene.add(mesh);
      segments.push(mesh);
    }

    return segments;
  }

  _buildMidLayer() {
    const segments = [];
    let cursorX = 0;

    for (let i = 0; i < MID_COUNT; i++) {
      const slotWidth = MID_SEGMENT_WIDTH * (1.0 + (i % 3) * MID_SEGMENT_VARIANCE * 0.5 + (i % 2) * 0.06);
      const building = createModularBuilding(i * 2, i, slotWidth);
      const sway = ((i % 3) - 1) * slotWidth * 0.06;
      building.position.set(cursorX + slotWidth * 0.5 + sway, CONFIG.groundY, MID_Z);
      this.scene.add(building);
      segments.push(building);

      // Dark mass behind each slot so any sub-pixel seam reads as shadow,
      // not empty sky between facades.
      const fillHeight = (building.userData.height ?? 4) * 1.05;
      const fill = new THREE.Mesh(
        new THREE.PlaneGeometry(slotWidth * 0.98, fillHeight),
        buildingSideMaterial
      );
      fill.position.set(0, fillHeight / 2, -BUILDING_DEPTH * 0.55);
      building.add(fill);

      cursorX += slotWidth;
    }

    return segments;
  }

  _buildNearLayer(midBuildings) {
    const billboards = [];
    const neonColors = [PALETTE.neon.magenta, PALETTE.neon.cyan, PALETTE.neon.lime, PALETTE.neon.orange];
    const width = 3.6;

    for (let i = 0; i < NEAR_COUNT; i++) {
      const color = neonColors[i % neonColors.length];
      const art = SIGN_TEXTURES[i % SIGN_TEXTURES.length];
      const height = width / art.aspect;

      const material = createCelMaterial({
        color: 0xffffff,
        map: art.texture,
        emissive: color,
        emissiveIntensity: CONFIG.bgBillboardEmissiveIntensity,
        rimColor: color,
        rimIntensity: 0.6,
      });

      const geometry = new THREE.PlaneGeometry(width, height);
      const mesh = new THREE.Mesh(geometry, material);

      const anchor = midBuildings[i % midBuildings.length];
      const buildingHeight = anchor.userData.height ?? 4;
      const x = anchor.position.x;
      const signBottom = CONFIG.groundY + buildingHeight * 0.42 + 0.35;
      const y = signBottom + height / 2;
      mesh.position.set(x, y, NEAR_Z);
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
    const totalWidth = segments.reduce((sum, segment) => sum + (segment.userData.slotWidth ?? segmentWidth), 0);
    for (const segment of segments) {
      const currentWidth = segment.userData.slotWidth ?? segmentWidth;
      segment.position.x -= speed * delta;
      if (segment.position.x <= -currentWidth * 0.5) {
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

      // Flicker: mostly steady, with occasional brief dim blips rather
      // than a smooth sine pulse, so it reads as an unreliable neon
      // sign instead of a slow, deliberate breathing glow. Each
      // billboard's timer is independently randomized so they don't
      // flicker in lockstep. (Phase 6 note: the old procedural canvas
      // texture also scrolled a scanline UV here - dropped now that the
      // map is real, non-repeating sign artwork rather than a tiling
      // stripe pattern; the flicker alone still sells "neon sign".)
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
    for (const building of this._mid) {
      this.scene.remove(building);
      building.userData.frontMaterial?.dispose();
      building.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
        }
      });
    }
    buildingSideMaterial.dispose();
    buildingRooftopMaterial.dispose();
    buildingConcreteMaterial.dispose();
    buildingTankMaterial.dispose();
    buildingPoleMaterial.dispose();
    for (const material of accentMaterialCache.values()) {
      material.dispose();
    }
    accentMaterialCache.clear();
    for (const billboard of this._near) {
      this.scene.remove(billboard.mesh);
      this.scene.remove(billboard.light);
      billboard.mesh.geometry.dispose();
      billboard.mesh.material.dispose();
    }
  }
}
