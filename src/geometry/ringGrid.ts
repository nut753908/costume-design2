import * as THREE from 'three';
import { necklineWeight, type NecklineType } from './neckline';

export interface RingGridRow {
  radius: number;
  y: number;
}

/**
 * 角度×高さのリングからなる手組み BufferGeometry を構築する(top.ts/dress.ts で共有)。
 * rows[0] を最上段(肩のライン)として、その行の頂点だけを角度ごとに necklineWeight() で
 * 重み付けして引き下げ、ネックラインを彫り込む。放射対称な Lathe では表現できない
 * ネックラインの落ち込みを扱うための、両ファイル共通の構築ロジック。
 */
export function buildRingGridGeometry(
  rows: RingGridRow[],
  angleSegments: number,
  necklineType: NecklineType,
  necklineDepth: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let row = 0; row < rows.length; row++) {
    const { radius, y: baseY } = rows[row];

    for (let col = 0; col <= angleSegments; col++) {
      const angle = (col / angleSegments) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      const y = row === 0 ? baseY - necklineDepth * necklineWeight(necklineType, angle) : baseY;
      positions.push(x, y, z);
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
