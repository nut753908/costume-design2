import * as THREE from 'three';

export interface SleeveParams {
  /** おおよそ胴体の半径 — sleeve が胴体の壁に接続する位置。 */
  attachRadius: number;
  sleeveRadius: number;
  sleeveLength: number;
  segments: number;
}

const SLEEVE_ANGLES = [Math.PI / 2, -Math.PI / 2] as const; // 右肩と左肩
const SLEEVE_DROOP = Math.PI / 5; // 水平から約36度下がる
const SLEEVE_INSET = 0.75; // 開始リングを内側に引き込み、浮かずに胴体の壁と重なるようにする
const SLEEVE_TAPER = 0.85; // 開始リングに対する終了リングの半径の割合

/** テーパー状の短いチューブ(左右)を1つのジオメトリとして構築する。body.ts の腕の円柱が
 * 胴体のカプセルと重なるのと同じ方法で、肩の位置で top の胴体の壁と重なることを意図している —
 * ブーリアン演算や穴あけは行わず、意図的な交差のみ。 */
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
  const rows = 2; // 開始リング(胴体側) + 終了リング(袖先) — まっすぐなテーパーチューブ

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
