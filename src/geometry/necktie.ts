import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface NecktieParams {
  knotWidth: number;
  knotHeight: number;
  knotThickness: number;
  bladeTopWidth: number;
  bladeBottomWidth: number;
  bladeThickness: number;
  bladeLength: number;
}

// 矩形断面の4隅(x,z の単位オフセット)。最初の頂点を末尾に複製して周を閉じているのは
// top.ts の angleSegments と同じ理由 — モジュロ演算なしで隣接リング間のインデックスを
// 単純な行×列のグリッドとして扱えるようにするため。
const CROSS_SECTION: readonly [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
  [1, 1],
];

/** top/jacket などの胴体の壁(半径 0.26〜0.34 程度)より前に出す深さ。`bagGroupNode.ts` の
 * `bagFrontDepthIn` と同じ理由 — z=0(体の中心)付近に置くと、シャツの前面の壁より
 * 奥(カメラから見て裏側)になり隠れて見えなくなる。 */
const NECKTIE_FRONT_DEPTH = 0.3;

/** 首元の結び目(小さな箱)と、そこから前面中央に垂れ下がるブレード(下ほど幅広になる
 * テーパー形状)を組み合わせたネクタイ。ブレードは sleeve.ts のチューブ構築(行=長さ方向、
 * 列=断面の周)と同じ考え方を、円形断面ではなく矩形の4隅に置き換えて使う。sleeve.ts と
 * 同様、チューブの両端にキャップは付けない(上端は結び目の陰、下端は先細りの点に近い)。 */
export function buildNecktieGeometry(params: NecktieParams): THREE.BufferGeometry {
  const { knotWidth, knotHeight, knotThickness, bladeTopWidth, bladeBottomWidth, bladeThickness, bladeLength } =
    params;

  const knot = new THREE.BoxGeometry(knotWidth, knotHeight, knotThickness).translate(
    0,
    -knotHeight / 2,
    NECKTIE_FRONT_DEPTH,
  );
  const blade = buildTaperedBlade(
    bladeTopWidth,
    bladeBottomWidth,
    bladeThickness,
    bladeLength,
    -knotHeight,
    NECKTIE_FRONT_DEPTH,
  );

  const merged = mergeGeometries([knot, blade])!;
  merged.computeVertexNormals();
  return merged;
}

function buildTaperedBlade(
  topWidth: number,
  bottomWidth: number,
  thickness: number,
  length: number,
  startY: number,
  zOffset: number,
): THREE.BufferGeometry {
  const rows = 2;
  const halfThickness = thickness / 2;
  const positions: number[] = [];

  for (let row = 0; row < rows; row++) {
    const t = row / (rows - 1);
    const y = startY - t * length;
    const halfWidth = (topWidth + (bottomWidth - topWidth) * t) / 2;

    for (const [cx, cz] of CROSS_SECTION) {
      positions.push(cx * halfWidth, y, zOffset + cz * halfThickness);
    }
  }

  const indices: number[] = [];
  const rowStride = CROSS_SECTION.length;
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < rowStride - 1; col++) {
      const a = row * rowStride + col;
      const b = a + rowStride;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // mergeGeometries は全ジオメトリが同じ頂点属性(名前・itemSize)を持つことを要求する。
  // BoxGeometry(結び目)は position/normal/uv を持つため、手組みのブレード側にも
  // ダミーの uv を追加して形を揃える(uv の値自体はトゥーンシェーディングでは未使用)。
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((positions.length / 3) * 2), 2));
  return geometry;
}
