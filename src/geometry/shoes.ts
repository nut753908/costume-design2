import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';

export interface ShoeParams {
  soleRadius: number;
  cuffRadius: number;
  height: number;
  toeLength: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** 1本の靴を、足元(地面・ソール)からくるぶし(履き口)までのプロファイルを回転体(Lathe)で
 * 構築する。回転体だけでは円形の断面にしかならないため、Z方向(前後)に非一様スケールして
 * つま先方向に伸びた靴らしい楕円形のシルエットにする。左右2つを ±legSpacing だけ X方向に
 * 離してまとめる処理は、この関数の責務ではなく `nodes/definitions/mirrorPair.ts`
 * (グループノード)がノードグラフ側で担う(`pants.ts`/`bodyLimbGroupNode.ts` と同じ形)。 */
export function buildShoeGeometry({ soleRadius, cuffRadius, height, toeLength, segments }: ShoeParams): THREE.BufferGeometry {
  const points = buildEasedLatheProfile(soleRadius, cuffRadius, height, 'up', PROFILE_STEPS);
  return new THREE.LatheGeometry(points, segments).scale(1, 1, toeLength);
}
