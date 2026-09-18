import * as THREE from 'three';

/** THREE.js 標準プリミティブをそのまま返すだけの、特定のガーメント/パーツに紐付かない
 * 汎用のジオメトリ生成関数群。巻き順は最初から正しい(geometry/CLAUDE.md の bag.ts/glasses.ts
 * と同じ理由)。`bodyGroupNode.ts` が胴体/頭/腕/脚のジェネレーターとして使う。 */

export function buildCapsuleGeometry({
  radius,
  length,
  capSegments,
  radialSegments,
}: {
  radius: number;
  length: number;
  capSegments: number;
  radialSegments: number;
}): THREE.BufferGeometry {
  return new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments);
}

export function buildSphereGeometry({
  radius,
  widthSegments,
  heightSegments,
}: {
  radius: number;
  widthSegments: number;
  heightSegments: number;
}): THREE.BufferGeometry {
  return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
}

export function buildCylinderGeometry({
  radiusTop,
  radiusBottom,
  height,
  radialSegments,
}: {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  radialSegments: number;
}): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
}

export function buildTorusGeometry({
  radius,
  tube,
  radialSegments,
  tubularSegments,
}: {
  radius: number;
  tube: number;
  radialSegments: number;
  tubularSegments: number;
}): THREE.BufferGeometry {
  return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
}

export function buildBoxGeometry({
  width,
  height,
  depth,
}: {
  width: number;
  height: number;
  depth: number;
}): THREE.BufferGeometry {
  return new THREE.BoxGeometry(width, height, depth);
}
