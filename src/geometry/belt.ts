import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';

export interface BeltParams {
  radius: number;
  thickness: number;
  bulge: number;
  segments: number;
}

const PROFILE_STEPS = 6;

/** waist アンカー(上端、radius)から下端(radius)まで、中間で bulge 倍に膨らむ帯状の
 * 回転体(Lathe)。上半分・下半分それぞれを latheProfile.ts の smoothstep イージングで
 * 構築し、中間の膨らみ位置で連結する(帽子/靴などの単純な片テーパーとは異なり、
 * 山なりのバックル部分を表現するため2本のプロファイルを繋いでいる)。 */
export function buildBeltGeometry(params: BeltParams): THREE.BufferGeometry {
  const { radius, thickness, bulge, segments } = params;
  const bulgeRadius = radius * bulge;
  const half = thickness / 2;

  const lower = buildEasedLatheProfile(bulgeRadius, radius, half, 'down', PROFILE_STEPS);
  const upper = buildEasedLatheProfile(radius, bulgeRadius, half, 'down', PROFILE_STEPS);
  for (const p of lower) p.y -= half;

  const points = [...lower.slice(0, -1), ...upper];
  return new THREE.LatheGeometry(points, segments);
}
