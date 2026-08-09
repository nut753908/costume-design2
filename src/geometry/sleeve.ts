import * as THREE from 'three';

export interface SleeveParams {
  /** Roughly the torso radius — where the sleeve plugs into the torso wall. */
  attachRadius: number;
  sleeveRadius: number;
  sleeveLength: number;
  segments: number;
}

const SLEEVE_ANGLES = [Math.PI / 2, -Math.PI / 2] as const; // right and left shoulder
const SLEEVE_DROOP = Math.PI / 5; // ~36 degrees below horizontal
const SLEEVE_INSET = 0.75; // start ring pulled inward so it overlaps the torso wall, not floating
const SLEEVE_TAPER = 0.85; // end-ring radius relative to start-ring radius

/** Builds two short tapered tubes (left/right) as a single geometry, meant to overlap the top's
 * torso wall at the shoulder the same way body.ts's arm cylinders overlap the torso capsule —
 * no boolean/hole-cutting, just intentional intersection. */
export function buildSleeveGeometry(params: SleeveParams): THREE.BufferGeometry {
  const { attachRadius, sleeveRadius, sleeveLength, segments } = params;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const originAngle of SLEEVE_ANGLES) {
    appendSleeveTube(positions, indices, originAngle, attachRadius, sleeveRadius, sleeveLength, segments);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function appendSleeveTube(
  positions: number[],
  indices: number[],
  originAngle: number,
  attachRadius: number,
  sleeveRadius: number,
  sleeveLength: number,
  segments: number,
): void {
  const outward = new THREE.Vector3(Math.sin(originAngle), 0, Math.cos(originAngle));
  const tangent = new THREE.Vector3(Math.cos(originAngle), 0, -Math.sin(originAngle));
  const axis = outward
    .clone()
    .multiplyScalar(Math.cos(SLEEVE_DROOP))
    .add(new THREE.Vector3(0, -Math.sin(SLEEVE_DROOP), 0))
    .normalize();
  const binormal = new THREE.Vector3().crossVectors(axis, tangent).normalize();
  const origin = outward.clone().multiplyScalar(attachRadius * SLEEVE_INSET);

  const baseIndex = positions.length / 3;
  const rows = 2; // start ring (at the torso) + end ring (sleeve tip) — a straight tapered tube

  for (let row = 0; row < rows; row++) {
    const t = row / (rows - 1);
    const center = origin.clone().add(axis.clone().multiplyScalar(t * sleeveLength));
    const radius = sleeveRadius * (1 - t * (1 - SLEEVE_TAPER));

    for (let col = 0; col <= segments; col++) {
      const theta = (col / segments) * Math.PI * 2;
      const point = center
        .clone()
        .add(tangent.clone().multiplyScalar(Math.cos(theta) * radius))
        .add(binormal.clone().multiplyScalar(Math.sin(theta) * radius));
      positions.push(point.x, point.y, point.z);
    }
  }

  const rowStride = segments + 1;
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < segments; col++) {
      const a = baseIndex + row * rowStride + col;
      const b = a + rowStride;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, c, b);
      indices.push(c, d, b);
    }
  }
}
