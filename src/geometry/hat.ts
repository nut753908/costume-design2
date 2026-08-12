import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';

export interface HatParams {
  brimRadius: number;
  crownRadius: number;
  height: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** head アンカー(つば、下)から頂点(クラウン、上)までのプロファイルを回転体(Lathe)で構築する。
 * 頭は skirt/pants/gloves と違って左右対称の単一パーツなので、merge は不要。 */
export function buildHatGeometry(params: HatParams): THREE.BufferGeometry {
  const { brimRadius, crownRadius, height, segments } = params;
  const points = buildEasedLatheProfile(brimRadius, crownRadius, height, 'up', PROFILE_STEPS);
  return new THREE.LatheGeometry(points, segments);
}
