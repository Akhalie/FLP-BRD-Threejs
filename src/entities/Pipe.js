import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from '../utils/Constants.js';

const PIPE_RADIUS = 0.5;
const CAP_RADIUS = PIPE_RADIUS * 1.15;
const CAP_HEIGHT = 0.35;
const BODY_LENGTH = 10; // long enough to run off the top/bottom of the screen

// Textured pipe skin (replaces the old flat vertex-colored look). The body
// texture tiles vertically along the long cylinder; the cap texture tiles
// once around the short rim piece.
const textureLoader = new THREE.TextureLoader();

function loadTiledTexture(url, repeatY) {
  const texture = textureLoader.load(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const BODY_TEXTURE = loadTiledTexture('/textures/pipe_body.png', BODY_LENGTH / 3);
const CAP_TEXTURE = loadTiledTexture('/textures/pipe_cap.png', 1);

/**
 * Builds one merged geometry combining the pipe body + its end cap,
 * translated so the whole assembly's local origin sits exactly at the
 * gap edge (the cap end). `direction` is +1 for the top assembly
 * (extends upward from the gap) or -1 for the bottom (extends
 * downward) - this lets Pipe.spawn() position each assembly with a
 * single `.position.set(0, gapY, 0)` instead of positioning two
 * separate meshes per side.
 *
 * Built once at module load and shared by every Pipe instance (Phase
 * 4 optimization): this turns what used to be 4 meshes / 2 materials
 * per pipe into 2 meshes / 1 shared pair of materials, halving
 * per-pipe draw calls without changing how any pipe looks. The body
 * and cap are kept as separate geometry groups (via `useGroups`) so
 * each can carry its own texture.
 */
function buildAssemblyGeometry(direction) {
  const bodyGeometry = new THREE.CylinderGeometry(PIPE_RADIUS, PIPE_RADIUS, BODY_LENGTH, 8);
  const capGeometry = new THREE.CylinderGeometry(CAP_RADIUS, CAP_RADIUS, CAP_HEIGHT, 8);

  bodyGeometry.translate(0, direction * (BODY_LENGTH / 2), 0);
  capGeometry.translate(0, direction * (CAP_HEIGHT / 2), 0);

  const merged = mergeGeometries([bodyGeometry, capGeometry], true);
  bodyGeometry.dispose();
  capGeometry.dispose();
  return merged;
}

const TOP_ASSEMBLY_GEOMETRY = buildAssemblyGeometry(1);
const BOTTOM_ASSEMBLY_GEOMETRY = buildAssemblyGeometry(-1);
const BODY_MATERIAL = new THREE.MeshLambertMaterial({ map: BODY_TEXTURE });
const CAP_MATERIAL = new THREE.MeshLambertMaterial({ map: CAP_TEXTURE });
const ASSEMBLY_MATERIALS = [BODY_MATERIAL, CAP_MATERIAL];

/**
 * A single pipe pair (top + bottom assembly), designed to be pooled
 * and repositioned rather than recreated. Call `spawn(x)` to activate
 * it at a given x position with a fresh random gap, `update()` to
 * move it, and check `.active` / `getX()` to know when to recycle it.
 *
 * Placeholder geometry (cylinders) stands in for `pipe.glb` from the
 * asset list until the low-poly model pipeline is wired up.
 */
export class Pipe {
  constructor() {
    this.group = new THREE.Group();

    this.topAssembly = new THREE.Mesh(TOP_ASSEMBLY_GEOMETRY, ASSEMBLY_MATERIALS);
    this.bottomAssembly = new THREE.Mesh(BOTTOM_ASSEMBLY_GEOMETRY, ASSEMBLY_MATERIALS);
    this.group.add(this.topAssembly, this.bottomAssembly);

    // Collision boxes are computed directly from known dimensions (below)
    // rather than via Box3.setFromObject() - this keeps hitboxes exactly
    // body-cylinder-sized (matching pre-merge behavior, ignoring the
    // wider cosmetic cap radius) and skips a matrix-world/traversal per
    // pipe per frame.
    this.topBox = new THREE.Box3();
    this.bottomBox = new THREE.Box3();
    this._topY = 0;
    this._bottomY = 0;
    this.gapCenterY = 0;

    this.active = false;
    this.passed = false; // flips true once the bird has flown past, for scoring
  }

  spawn(x) {
    const gapCenter = THREE.MathUtils.randFloat(CONFIG.pipeGapCenterMin, CONFIG.pipeGapCenterMax);
    const halfGap = CONFIG.pipeGap / 2;
    this._topY = gapCenter + halfGap;
    this._bottomY = gapCenter - halfGap;
    this.gapCenterY = gapCenter;

    this.topAssembly.position.set(0, this._topY, 0);
    this.bottomAssembly.position.set(0, this._bottomY, 0);
    this.group.position.set(x, 0, 0);

    this.active = true;
    this.passed = false;
    this._updateBoxes();
  }

  update(delta, speed) {
    if (!this.active) return;
    this.group.position.x -= speed * delta;
    this._updateBoxes();
  }

  getX() {
    return this.group.position.x;
  }

  getGapCenterY() {
    return this.gapCenterY;
  }

  _updateBoxes() {
    const x = this.group.position.x;
    this.topBox.min.set(x - PIPE_RADIUS, this._topY, -PIPE_RADIUS);
    this.topBox.max.set(x + PIPE_RADIUS, this._topY + BODY_LENGTH, PIPE_RADIUS);
    this.bottomBox.min.set(x - PIPE_RADIUS, this._bottomY - BODY_LENGTH, -PIPE_RADIUS);
    this.bottomBox.max.set(x + PIPE_RADIUS, this._bottomY, PIPE_RADIUS);
  }
}
