import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';

export interface SockParams {
  ankleRadius: number;
  calfRadius: number;
  height: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** 1本の靴下を、足首(アンカー、下)からふくらはぎ(上)までのプロファイルを回転体(Lathe)で
 * 構築する。shoes.ts と同じ feet アンカー・direction='up' を使い、shoes より高さを大きく
 * とることで、靴の履き口から靴下がのぞいて見えるようにする(ブーリアン演算による切り欠きは
 * 行わない、意図的な重なり)。左右2本を ±legSpacing だけ X方向に離してまとめる処理は、
 * この関数の責務ではなく `nodes/definitions/mirrorPair.ts`(グループノード)がノードグラフ側で
 * 担う(`pants.ts`/`bodyLimbGroupNode.ts` と同じ形)。 */
export function buildSockGeometry({ ankleRadius, calfRadius, height, segments }: SockParams): THREE.BufferGeometry {
  const points = buildEasedLatheProfile(ankleRadius, calfRadius, height, 'up', PROFILE_STEPS);
  return new THREE.LatheGeometry(points, segments);
}
