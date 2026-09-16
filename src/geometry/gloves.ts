import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';

export interface GloveParams {
  wristRadius: number;
  handRadius: number;
  length: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** 1つの手袋を、手首(アンカー、上)から指先(下)までのプロファイルを回転体(Lathe)で構築する。
 * 左右2つを ±armSpacing だけ X方向に離してまとめる処理は、この関数の責務ではなく
 * `nodes/definitions/mirrorPair.ts`(グループノード)がノードグラフ側で担う
 * (`pants.ts`/`bodyLimbGroupNode.ts` と同じ形)。 */
export function buildGloveGeometry({ wristRadius, handRadius, length, segments }: GloveParams): THREE.BufferGeometry {
  const points = buildEasedLatheProfile(wristRadius, handRadius, length, 'down', PROFILE_STEPS);
  return new THREE.LatheGeometry(points, segments);
}
