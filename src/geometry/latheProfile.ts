import * as THREE from 'three';

export type ProfileDirection = 'up' | 'down';

/**
 * アンカー側(radius=startRadius, t=0)から反対側の端(radius=endRadius, t=1)まで、半径を
 * smoothstep でイージングしながら結ぶ、LatheGeometry 用のプロファイル点列を生成する。
 * direction='down' はアンカーから -Y へ(スカート/パンツの脚/手袋のように垂れ下がる)、
 * 'up' はアンカーから +Y へ(靴/帽子のように上に伸びる)。LatheGeometry は外向きの巻き順/法線を
 * 得るために下→上の順のプロファイルを期待するため、direction に応じて必要な場合のみ reverse する。
 */
export function buildEasedLatheProfile(
  startRadius: number,
  endRadius: number,
  distance: number,
  direction: ProfileDirection,
  steps: number,
): THREE.Vector2[] {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const eased = t * t * (3 - 2 * t);
    const radius = startRadius + (endRadius - startRadius) * eased;
    const y = direction === 'down' ? -t * distance : t * distance;
    points.push(new THREE.Vector2(radius, y));
  }
  if (direction === 'down') points.reverse();
  return points;
}
