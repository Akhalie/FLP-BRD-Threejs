import * as THREE from 'three';

/**
 * Stylization Phase 2 (see STYLE_GUIDE.md / STYLE_PHASE_2_SHADERS_MATERIALS.md).
 *
 * Object-space "inflated mesh" outline: a backface-only, slightly
 * scaled-up clone of a mesh, rendered in a flat unlit color. Because
 * only backfaces render (THREE.BackSide) and the clone is bigger than
 * the original, only a thin sliver pokes out from behind the real
 * mesh's silhouette - reading as a cel-shading outline with no
 * full-screen post-process pass required.
 *
 * This is the same technique Pipe.js already used (topOutline /
 * bottomOutline); this module just makes it reusable so every entity
 * (Bird, Coin, Dragon, ...) can opt in with one call instead of
 * hand-rolling the pattern per file.
 */

// Outline materials are cheap and few in number (one per outline
// color actually used across the game) - share them instead of
// letting every entity allocate its own.
const OUTLINE_MATERIAL_CACHE = new Map();

function getOutlineMaterial(color) {
  let material = OUTLINE_MATERIAL_CACHE.get(color);
  if (!material) {
    material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.BackSide,
    });
    OUTLINE_MATERIAL_CACHE.set(color, material);
  }
  return material;
}

/**
 * Adds an outline child mesh to `mesh`, sharing `mesh.geometry`
 * (no extra geometry allocation) and automatically following its
 * parent's position/rotation/scale since it's parented directly.
 *
 * @param {THREE.Mesh} mesh - the entity mesh to outline
 * @param {object} [options]
 * @param {number} [options.color=0x000000] - outline color (hex)
 * @param {number} [options.scale=1.06] - how much bigger the outline shell is; larger = thicker outline
 * @returns {THREE.Mesh} the outline mesh, already added as a child of `mesh`
 */
export function addOutline(mesh, { color = 0x000000, scale = 1.06 } = {}) {
  const outline = new THREE.Mesh(mesh.geometry, getOutlineMaterial(color));
  outline.scale.setScalar(scale);
  outline.position.set(0, 0, 0);
  outline.rotation.set(0, 0, 0);

  // Outlines are purely visual - never let them get picked up by
  // raycasting/collision code that walks a mesh's children.
  outline.raycast = () => {};

  // Outline meshes never own their geometry (shared with the parent
  // mesh) or their material (shared across every entity using that
  // outline color via OUTLINE_MATERIAL_CACHE above). Any entity that
  // disposes its own geometry/materials on teardown (e.g. Dragon,
  // spawned/despawned per fight) must check this flag and skip
  // disposing outline children - otherwise disposing one Dragon's
  // outline material would break every other entity's outline still
  // using that same cached material.
  outline.isOutlineMesh = true;

  mesh.add(outline);
  return outline;
}
