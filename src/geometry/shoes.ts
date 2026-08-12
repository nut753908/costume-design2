import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';
import { buildMirroredPairGeometry } from './mirrorPair';

export interface ShoesParams {
  soleRadius: number;
  cuffRadius: number;
  height: number;
  toeLength: number;
  legSpacing: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** 1本の靴を、足元(地面・ソール)からくるぶし(履き口)までのプロファイルを回転体(Lathe)で
 * 構築する。 */
function buildShoeGeometry(
  soleRadius: number,
  cuffRadius: number,
  height: number,
  segments: number,
): THREE.BufferGeometry {
  const points = buildEasedLatheProfile(soleRadius, cuffRadius, height, 'up', PROFILE_STEPS);
  return new THREE.LatheGeometry(points, segments);
}

/** 左右2つの靴のジオメトリを1つの BufferGeometry にまとめる。回転体だけでは円形の断面にしか
 * ならないため、Z方向(前後)に非一様スケールしてつま先方向に伸びた靴らしい楕円形の
 * シルエットにする。 */
export function buildShoesGeometry(params: ShoesParams): THREE.BufferGeometry {
  const { soleRadius, cuffRadius, height, toeLength, legSpacing, segments } = params;
  return buildMirroredPairGeometry(() => {
    const shoe = buildShoeGeometry(soleRadius, cuffRadius, height, segments);
    return shoe.scale(1, 1, toeLength);
  }, legSpacing);
}
