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

  // lower: y=-thickness(radius, 下端) 〜 y=-half(bulgeRadius, 中間)。buildEasedLatheProfile は
  // 常に y=0 起点で返すため、下半分として使うには半分の高さぶん下にシフトする必要がある。
  const lower = buildEasedLatheProfile(bulgeRadius, radius, half, 'down', PROFILE_STEPS);
  const upper = buildEasedLatheProfile(radius, bulgeRadius, half, 'down', PROFILE_STEPS);
  for (const p of lower) p.y -= half;

  // 継ぎ目(y=-half)は lower の最後の点と upper の最初の点が両方 bulgeRadius になり一致する
  // (どちらも eased 区間の bulgeRadius 側の端点であるため)。重複頂点を避けるため lower 側を除く。
  const points = [...lower.slice(0, -1), ...upper];
  return new THREE.LatheGeometry(points, segments);
}
