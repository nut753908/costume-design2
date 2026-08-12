import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';
import { buildMirroredPairGeometry } from './mirrorPair';

export interface SocksParams {
  ankleRadius: number;
  calfRadius: number;
  height: number;
  legSpacing: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** 1本の靴下を、足首(アンカー、下)からふくらはぎ(上)までのプロファイルを回転体(Lathe)で
 * 構築する。shoes.ts と同じ feet アンカー・direction='up' を使い、shoes より高さを大きく
 * とることで、靴の履き口から靴下がのぞいて見えるようにする(ブーリアン演算による切り欠きは
 * 行わない、意図的な重なり)。 */
function buildSockGeometry(
  ankleRadius: number,
  calfRadius: number,
  height: number,
  segments: number,
): THREE.BufferGeometry {
  const points = buildEasedLatheProfile(ankleRadius, calfRadius, height, 'up', PROFILE_STEPS);
  return new THREE.LatheGeometry(points, segments);
}

/** 左右2本の靴下のジオメトリを1つの BufferGeometry にまとめる。legSpacing は shoes/pants と
 * 共有できるようにしている(同じ間隔で脚に沿わせるため)。 */
export function buildSocksGeometry(params: SocksParams): THREE.BufferGeometry {
  const { ankleRadius, calfRadius, height, legSpacing, segments } = params;
  return buildMirroredPairGeometry(
    () => buildSockGeometry(ankleRadius, calfRadius, height, segments),
    legSpacing,
  );
}
