import * as THREE from 'three';
import { PALETTE } from '../utils/Constants.js';

/**
 * Stylization Phase 2 (see STYLE_GUIDE.md / STYLE_PHASE_2_SHADERS_MATERIALS.md).
 *
 * Wraps THREE.MeshToonMaterial - three.js's built-in quantized-lighting
 * material - with two things every entity in the game should share:
 *
 *   1. A single 3-band gradient map (shadow / mid / lit), matching the
 *      Style Guide's "quantized diffuse bands (2-3 levels)" spec.
 *   2. An optional fresnel-style rim-light term injected via
 *      onBeforeCompile, so silhouettes pick up a neon edge glow
 *      against dark backgrounds (Style Guide: "bold rim/highlight
 *      accents").
 *
 * Every entity should build its materials through createCelMaterial()
 * instead of constructing MeshLambertMaterial/MeshToonMaterial
 * directly, so the whole game shares one shading model and one
 * gradient map instance instead of each entity file reinventing it.
 */

// --- Shared gradient map (built once, reused by every CelMaterial) ---
let gradientMapCache = null;

function getGradientMap() {
  if (gradientMapCache) return gradientMapCache;

  // 3 bands: dark shadow, mid tone, bright lit. THREE.MeshToonMaterial
  // samples this 1D texture by N·L; NearestFilter keeps the bands
  // crisp (no smooth interpolation between them, which would defeat
  // the point of cel shading).
  const bands = new Uint8Array([60, 150, 255]);
  const texture = new THREE.DataTexture(bands, bands.length, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  gradientMapCache = texture;
  return gradientMapCache;
}

/**
 * @param {object} [options]
 * @param {number} [options.color=0xffffff] - base diffuse color (hex)
 * @param {THREE.Texture} [options.map=null] - optional base color texture (e.g. Pipe's tiled skins)
 * @param {number} [options.emissive=0x000000] - emissive hex, for neon trim/panels
 * @param {number} [options.emissiveIntensity=1]
 * @param {number|null} [options.rimColor=PALETTE.neon.cyan] - edge-glow color; pass `null` to skip the rim shader hook entirely
 * @param {number} [options.rimPower=2.2] - higher = thinner rim
 * @param {number} [options.rimIntensity=0.5] - 0 keeps the hook but makes it invisible; use `rimColor: null` to actually skip it
 */
export function createCelMaterial({
  color = 0xffffff,
  map = null,
  emissive = 0x000000,
  emissiveIntensity = 1,
  rimColor = PALETTE.neon.cyan,
  rimPower = 2.2,
  rimIntensity = 0.5,
} = {}) {
  const material = new THREE.MeshToonMaterial({
    color,
    map,
    emissive,
    emissiveIntensity,
    gradientMap: getGradientMap(),
  });

  if (rimColor !== null) {
    _addRimLight(material, rimColor, rimPower, rimIntensity);
  }

  return material;
}

/**
 * Injects a fresnel-style rim term into MeshToonMaterial's fragment
 * shader via onBeforeCompile, adding it to `outgoingLight` right
 * before three.js's `opaque_fragment` chunk assigns `gl_FragColor` -
 * see node_modules/three/src/renderers/shaders/ShaderLib/meshtoon.glsl.js.
 * This layers the rim on top of whatever the toon lighting model
 * already computed instead of replacing it.
 *
 * NOTE: this depends on three.js's internal shader chunk names/order
 * (`vNormal`, `vViewPosition`, `outgoingLight`, `<opaque_fragment>`).
 * If a future three.js upgrade restructures meshtoon_frag.glsl.js,
 * this is the first place to check if rim lighting stops appearing -
 * worst case it silently no-ops rather than breaking the base material.
 */
function _addRimLight(material, rimColorHex, rimPower, rimIntensity) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.rimColor = { value: new THREE.Color(rimColorHex) };
    shader.uniforms.rimPower = { value: rimPower };
    shader.uniforms.rimIntensity = { value: rimIntensity };

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 rimColor;
        uniform float rimPower;
        uniform float rimIntensity;`
      )
      .replace(
        '#include <opaque_fragment>',
        `float rimFactor = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), rimPower);
        outgoingLight += rimColor * rimFactor * rimIntensity;
        #include <opaque_fragment>`
      );
  };

  // Materials with onBeforeCompile need a stable, unique cache key or
  // three.js's program cache will happily share one compiled shader
  // across materials with different rim colors/power/intensity.
  // Keying on those three values keeps the program cache small (one
  // compiled program per distinct rim look actually used in the game,
  // not one per material instance).
  material.customProgramCacheKey = () => `cel-rim-${rimColorHex}-${rimPower}-${rimIntensity}`;
}
