import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CONFIG } from '../utils/Constants.js';

/**
 * Stylization Phase 3 (see STYLE_PHASE_3_LIGHTING_POSTFX.md).
 *
 * A single combined post-process pass folding together everything the
 * Style Guide's "Lighting & Post-Processing" section calls for besides
 * bloom: color grade (push toward the palette's blues/purples + a
 * neon saturation boost), vignette, film grain, and a whisper of
 * screen-edge-only chromatic aberration.
 *
 * These are deliberately ONE ShaderPass instead of three or four
 * separate passes - every extra pass in an EffectComposer chain is a
 * full-screen render-target ping-pong, and this project already pays
 * for that once with UnrealBloomPass (which is itself several internal
 * blur passes). Folding the rest together keeps Phase 3's total cost
 * close to "bloom + one more pass" rather than "bloom + four more".
 * Each effect is still independently tunable (down to fully off) via
 * its own uniform, so nothing here is a package deal.
 */
export function createGradePass({
  tintColor = CONFIG.gradeTintColor,
  tintAmount = CONFIG.gradeTintAmount,
  saturation = CONFIG.gradeSaturation,
  vignette = CONFIG.gradeVignette,
  grain = CONFIG.gradeGrain,
  aberration = CONFIG.gradeAberration,
} = {}) {
  const tint = new THREE.Color(tintColor);

  const shader = {
    uniforms: {
      tDiffuse: { value: null },
      // Normalized against its own max channel so it shifts hue
      // without also darkening the image - the darkening/mood comes
      // from tintAmount + vignette instead, kept as separate knobs.
      uTint: {
        value: new THREE.Vector3(tint.r, tint.g, tint.b).multiplyScalar(
          1 / Math.max(tint.r, tint.g, tint.b, 0.0001)
        ),
      },
      uTintAmount: { value: tintAmount },
      uSaturation: { value: saturation },
      uVignette: { value: vignette },
      uGrain: { value: grain },
      uAberration: { value: aberration },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec3 uTint;
      uniform float uTintAmount;
      uniform float uSaturation;
      uniform float uVignette;
      uniform float uGrain;
      uniform float uAberration;
      uniform float uTime;
      varying vec2 vUv;

      // Cheap per-pixel hash - good enough for grain, no texture lookup needed.
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(41.0, 289.0))) * 43758.5453);
      }

      void main() {
        vec2 uv = vUv;
        vec2 centered = uv - 0.5;
        float edge = dot(centered, centered); // 0 at center, ~0.5 at corners

        // Chromatic aberration: offset scales with distance from
        // center, so the middle of the frame (where gameplay actually
        // happens) stays completely clean and only the screen edges
        // fringe - Style Guide calls this out as "very subtle".
        vec2 dir = centered * uAberration * edge;
        float r = texture2D(tDiffuse, uv - dir).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, uv + dir).b;
        vec3 color = vec3(r, g, b);

        // Color grade: push toward the palette tint without crushing
        // blacks or clipping highlights.
        color = mix(color, color * uTint, uTintAmount);

        // Neon saturation boost.
        float luma = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(vec3(luma), color, uSaturation);

        // Vignette - multiplicative corner darkening.
        color *= 1.0 - uVignette * edge;

        // Film grain - animated so it doesn't read as a static overlay.
        float grain = (hash(uv * vec2(1024.0, 1024.0) + uTime) - 0.5) * uGrain;
        color += grain;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  };

  return new ShaderPass(shader);
}
