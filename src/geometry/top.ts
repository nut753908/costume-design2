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

const NECKLINE_HALF_WIDTH = Math.PI / 3; // 落ち込みは正面から左右60度でゼロまでテーパーする

/** 0(正面、angle=0)が落ち込みの最深点で、NECKLINE_HALF_WIDTH で0までテーパーする。 */
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

/** ノースリーブのトップスをリンググリッドのチューブとして構築する(Lathe/Extrude では
 * ないのは、放射対称でないネックラインを作れないため)。最上段のリングの頂点のみを
 * 角度ごとに引き下げてネックラインを彫り込み、残りのチューブは単純な円柱の壁とする。 */
export function buildTopGeometry(params: TopParams): THREE.BufferGeometry {
  const { torsoRadius, length, necklineType, necklineDepth, angleSegments, heightSegments } = params;

  const positions: number[] = [];
  for (let row = 0; row <= heightSegments; row++) {
    const v = row / heightSegments; // 上(肩のライン)で0、裾で1
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
      // 壁の外向き法線(Y軸から離れる方向)が表面になるように巻き順を設定。
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
