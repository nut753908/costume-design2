import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';
import type { NecklineType } from './neckline';
import { buildRingGridGeometry } from './ringGrid';

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
 * hemRadius(裾)へイージングさせる。 */
export function buildDressGeometry(params: DressParams): THREE.BufferGeometry {
  const { torsoRadius, hemRadius, length, necklineType, necklineDepth, angleSegments, heightSegments } = params;

  // buildEasedLatheProfile('down', ...) は LatheGeometry 向けに下→上の順で返す(CLAUDE.md/
  // latheProfile.ts 参照)。ここでは row=0 を肩、row=heightSegments を裾にしたいので reverse で戻す。
  const profile = buildEasedLatheProfile(torsoRadius, hemRadius, length, 'down', heightSegments)
    .slice()
    .reverse();
  const rows = profile.map((p) => ({ radius: p.x, y: p.y }));

  return buildRingGridGeometry(rows, angleSegments, necklineType, necklineDepth);
}
