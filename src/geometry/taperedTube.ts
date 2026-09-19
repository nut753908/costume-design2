import * as THREE from 'three';

export type TubeShape = 'ellipse' | 'rectangle';

export interface TaperedTubeParams {
  start: THREE.Vector3;
  end: THREE.Vector3;
  /** start 側/end 側の断面の、`tangent` 方向(下記)の全幅と `binormal` 方向の全厚み。 */
  startWidth: number;
  startThickness: number;
  endWidth: number;
  endThickness: number;
  /** 断面の形。`'ellipse'` は `segments` 分割の楕円、`'rectangle'` は `segments` を使わない
   * 4隅の矩形(width×thickness にちょうど収まる)。 */
  shape: TubeShape;
  segments: number;
}

// 矩形断面の4隅(tangent, binormal の単位オフセット)を、楕円と同じ向き(θ が増える向き)に
// 並べたもの。最初の頂点を末尾に複製して周を閉じているのは、楕円の col=0 と col=segments が
// 同じ位置に重なるのと同じ理由 — モジュロ演算なしで隣接リング間のインデックスを単純な
// 行×列のグリッドとして扱えるようにするため。
const RECTANGLE_CORNERS: readonly [number, number][] = [
  [1, 1],
  [-1, 1],
  [-1, -1],
  [1, -1],
  [1, 1],
];

/** 軸が Y と平行でない限り、tangent は水平(Y × axis)。平行なときは +X を使う。
 * (axis, tangent, binormal)は右手系になる(binormal = axis × tangent)。 */
export function tubeFrame(start: THREE.Vector3, end: THREE.Vector3): {
  axis: THREE.Vector3;
  tangent: THREE.Vector3;
  binormal: THREE.Vector3;
} {
  const axis = end.clone().sub(start);
  if (axis.lengthSq() < 1e-12) axis.set(0, -1, 0);
  axis.normalize();
  const tangent = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), axis);
  if (tangent.lengthSq() < 1e-12) tangent.set(1, 0, 0);
  tangent.normalize();
  const binormal = new THREE.Vector3().crossVectors(axis, tangent).normalize();
  return { axis, tangent, binormal };
}

/** start から end まで、両端の断面(幅×厚み)を直線的に補間する2リングのチューブ(キャップ
 * 無し)。放射対称ではない/斜めの軸を持つ手組みチューブ(袖、ネクタイのブレード)向けの、
 * `ringGrid.ts` と同じ「行=長さ方向、列=断面の周」の構築。頂点属性は position/normal のみ。 */
export function buildTaperedTube(params: TaperedTubeParams): THREE.BufferGeometry {
  const { start, end, startWidth, startThickness, endWidth, endThickness, shape, segments } = params;
  const { tangent, binormal } = tubeFrame(start, end);

  const section: [number, number][] =
    shape === 'rectangle'
      ? RECTANGLE_CORNERS.map(([u, v]) => [u, v])
      : Array.from({ length: segments + 1 }, (_, col) => {
          const theta = (col / segments) * Math.PI * 2;
          return [Math.cos(theta), Math.sin(theta)];
        });
  // 矩形の隅は width/2 × thickness/2 にちょうど収まる(u,v が ±1)。楕円は半径 1 の円を
  // width/2 × thickness/2 に伸ばす。
  const half = 0.5;

  const positions: number[] = [];
  const rows = [
    { center: start, width: startWidth, thickness: startThickness },
    { center: end, width: endWidth, thickness: endThickness },
  ];
  for (const { center, width, thickness } of rows) {
    for (const [u, v] of section) {
      const point = center
        .clone()
        .add(tangent.clone().multiplyScalar(u * width * half))
        .add(binormal.clone().multiplyScalar(v * thickness * half));
      positions.push(point.x, point.y, point.z);
    }
  }

  const indices: number[] = [];
  const rowStride = section.length;
  for (let col = 0; col < rowStride - 1; col++) {
    const a = col;
    const b = a + rowStride;
    const c = a + 1;
    const d = b + 1;
    indices.push(a, c, b);
    indices.push(c, d, b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
