import * as THREE from 'three';

export type NecklineType = 'round' | 'v' | 'square';

export interface TopParams {
  torsoRadius: number;
  length: number;
  necklineType: NecklineType;
  necklineDepth: number;
  angleSegments: number;
  heightSegments: number;
}

const NECKLINE_HALF_WIDTH = Math.PI / 3; // dip tapers to zero 60 degrees from front on each side

/** 0 (front, angle=0) is the deepest point of the dip, tapering to 0 at NECKLINE_HALF_WIDTH. */
function necklineWeight(type: NecklineType, angle: number): number {
  let a = angle;
  if (a > Math.PI) a -= Math.PI * 2;
  if (Math.abs(a) > NECKLINE_HALF_WIDTH) return 0;
  const t = Math.abs(a) / NECKLINE_HALF_WIDTH;

  switch (type) {
    case 'square':
      return 1;
    case 'v':
      return 1 - t;
    case 'round':
    default:
      return 1 - t * t;
  }
}

/** Builds a sleeveless top as a ring-grid tube (not a Lathe/Extrude — those can't produce a
 * non-radially-symmetric neckline). Only the top ring's vertices are pulled down per-angle to
 * carve the neckline; the rest of the tube is a plain cylinder wall. */
export function buildTopGeometry(params: TopParams): THREE.BufferGeometry {
  const { torsoRadius, length, necklineType, necklineDepth, angleSegments, heightSegments } = params;

  const positions: number[] = [];
  for (let row = 0; row <= heightSegments; row++) {
    const v = row / heightSegments; // 0 at top (shoulder line), 1 at hem
    const baseY = -v * length;

    for (let col = 0; col <= angleSegments; col++) {
      const angle = (col / angleSegments) * Math.PI * 2;
      const x = Math.sin(angle) * torsoRadius;
      const z = Math.cos(angle) * torsoRadius;

      const y = row === 0 ? baseY - necklineDepth * necklineWeight(necklineType, angle) : baseY;
      positions.push(x, y, z);
    }
  }

  const indices: number[] = [];
  const rowStride = angleSegments + 1;
  for (let row = 0; row < heightSegments; row++) {
    for (let col = 0; col < angleSegments; col++) {
      const a = row * rowStride + col;
      const b = a + rowStride;
      const c = a + 1;
      const d = b + 1;
      // Wound so the wall's outward normal (away from the Y axis) is front-facing.
      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
