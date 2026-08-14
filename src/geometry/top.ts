import * as THREE from 'three';
import type { NecklineType } from './neckline';
import { buildRingGridGeometry } from './ringGrid';

export interface TopParams {
  torsoRadius: number;
  length: number;
  necklineType: NecklineType;
  necklineDepth: number;
  angleSegments: number;
  heightSegments: number;
}

/** ノースリーブのトップスをリンググリッドのチューブとして構築する(Lathe/Extrude では
 * ないのは、放射対称でないネックラインを作れないため)。半径は torsoRadius で一定、
 * 最上段のリングの頂点のみを buildRingGridGeometry がネックライン分だけ引き下げる。 */
export function buildTopGeometry(params: TopParams): THREE.BufferGeometry {
  const { torsoRadius, length, necklineType, necklineDepth, angleSegments, heightSegments } = params;

  const rows = Array.from({ length: heightSegments + 1 }, (_, row) => {
    const v = row / heightSegments; // 上(肩のライン)で0、裾で1
    return { radius: torsoRadius, y: -v * length };
  });

  return buildRingGridGeometry(rows, angleSegments, necklineType, necklineDepth);
}
