import * as THREE from 'three';

export interface HatParams {
  brimRadius: number;
  crownRadius: number;
  height: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** head アンカー(つば、下)から頂点(クラウン、上)までのプロファイルを回転体(Lathe)で
 * 構築する。skirt.ts と同じ smoothstep イージング。shoes.ts と同じ理由でプロファイルは
 * すでに下(つば)→上(クラウン)の順になっており、reverse() は不要。頭は skirt/pants/gloves と
 * 違って左右対称の単一パーツなので、merge は不要。 */
export function buildHatGeometry(params: HatParams): THREE.BufferGeometry {
  const { brimRadius, crownRadius, height, segments } = params;
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= PROFILE_STEPS; i++) {
    const t = i / PROFILE_STEPS; // つばで0、クラウン頂点で1
    const eased = t * t * (3 - 2 * t);
    const radius = brimRadius + (crownRadius - brimRadius) * eased;
    const y = t * height;
    points.push(new THREE.Vector2(radius, y));
  }
  return new THREE.LatheGeometry(points, segments);
}
