import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';
import { necklineWeight, type NecklineType } from './neckline';

export interface DressParams {
  torsoRadius: number;
  hemRadius: number;
  length: number;
  necklineType: NecklineType;
  necklineDepth: number;
  angleSegments: number;
  heightSegments: number;
}

/** top.ts のリンググリッド+ネックライン彫り込み手法と、skirt.ts が使う smoothstep
 * イージング済み半径プロファイル(latheProfile.ts)を組み合わせた、肩から裾まで
 * 1続きのワンピース。放射非対称なネックラインを持つため top.ts と同様に Lathe/Extrude
 * ではなく手組みのリンググリッドで構築し、各行の半径は torsoRadius(肩)から
 * hemRadius(裾)へイージングさせる。最上段のリングの頂点のみを角度ごとに引き下げて
 * ネックラインを彫り込み、残りは skirt のように広がる(または窄まる)壁とする。 */
export function buildDressGeometry(params: DressParams): THREE.BufferGeometry {
  const { torsoRadius, hemRadius, length, necklineType, necklineDepth, angleSegments, heightSegments } = params;

  // buildEasedLatheProfile('down', ...) は LatheGeometry 向けに下→上の順で返す(CLAUDE.md/
  // latheProfile.ts 参照)。ここでは row=0 を肩、row=heightSegments を裾にしたいので reverse で戻す。
  const profile = buildEasedLatheProfile(torsoRadius, hemRadius, length, 'down', heightSegments)
    .slice()
    .reverse();

  const positions: number[] = [];
  for (let row = 0; row <= heightSegments; row++) {
    const { x: radius, y: baseY } = profile[row];

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
  for (let row = 0; row < heightSegments; row++) {
    for (let col = 0; col < angleSegments; col++) {
      const a = row * rowStride + col;
      const b = a + rowStride;
      const c = a + 1;
      const d = b + 1;
      // 壁の外向き法線(Y軸から離れる方向)が表面になるように巻き順を設定(top.ts と同じ)。
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
