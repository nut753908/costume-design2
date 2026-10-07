import * as THREE from 'three';
import { necklineWeight } from './neckline';

export interface RingGridRow {
  radius: number;
  y: number;
}

/**
 * 角度×高さのリングからなる手組み BufferGeometry を構築する(`ringGridGenerator` が使う)。
 * rows[0] を最上段(首まわり)として、角度ごとに「最上段から necklineDepth × necklineWeight() だけ
 * 下がった高さ」を彫り込みの線とし(`necklineWeights` は角度に対する落ち込み量の曲線)、その線より上に
 * ある行の頂点を線上の点(半径は上下の行から補間)へ寄せてネックラインを彫り込む。最上段だけを
 * 下げると、肩の丸みで行の間隔が狭い所では下の行を越えて面が折り返すため、線より上の行をまとめて
 * 寄せる。放射対称な Lathe では表現できないネックラインの落ち込みを扱うためのための構築ロジック。
 */
export function buildRingGridGeometry(
  rows: RingGridRow[],
  angleSegments: number,
  necklineWeights: THREE.Curve<THREE.Vector2> | undefined,
  necklineDepth: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col <= angleSegments; col++) {
      const angle = (col / angleSegments) * Math.PI * 2;
      const cutY = rows[0].y - necklineDepth * necklineWeight(necklineWeights, angle);
      const { radius, y } = rows[row].y > cutY ? radiusAtHeight(rows, cutY) : rows[row];
      positions.push(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    }
  }

  const indices: number[] = [];
  const rowStride = angleSegments + 1;
  const heightSegments = rows.length - 1;
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

/** 上→下の順に並んだ行のうち、高さ `y` を挟む2行の半径を線形補間した点。`y` が最下段より下なら最下段。 */
function radiusAtHeight(rows: RingGridRow[], y: number): RingGridRow {
  for (let i = 0; i < rows.length - 1; i++) {
    const upper = rows[i];
    const lower = rows[i + 1];
    if (y <= upper.y && y >= lower.y) {
      const t = upper.y === lower.y ? 0 : (upper.y - y) / (upper.y - lower.y);
      return { radius: upper.radius + (lower.radius - upper.radius) * t, y };
    }
  }
  return rows[rows.length - 1];
}
