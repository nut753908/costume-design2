import * as THREE from 'three';

export interface SkirtParams {
  waistRadius: number;
  length: number;
  /** 0 = straight/pencil skirt, higher = more flared hem. */
  flare: number;
  segments: number;
}

const PROFILE_STEPS = 12;

/** Builds a lathe-revolved skirt silhouette from waist to hem. */
export function buildSkirtGeometry(params: SkirtParams): THREE.BufferGeometry {
  const { waistRadius, length, flare, segments } = params;
  const hemRadius = waistRadius * (1 + Math.max(0, flare));

  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= PROFILE_STEPS; i++) {
    const t = i / PROFILE_STEPS; // 0 at waist, 1 at hem
    const eased = t * t * (3 - 2 * t); // smoothstep for a gentle A-line curve
    const radius = waistRadius + (hemRadius - waistRadius) * eased;
    const y = -t * length;
    points.push(new THREE.Vector2(radius, y));
  }
  // LatheGeometry expects the profile ordered bottom-to-top to produce outward-facing
  // winding/normals; reverse since we built it top(waist)-to-bottom(hem) above.
  points.reverse();

  return new THREE.LatheGeometry(points, segments);
}
