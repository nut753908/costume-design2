import * as THREE from 'three';

export interface PantsParams {
  waistRadius: number;
  hemRadius: number;
  inseam: number;
  legSpacing: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** 1本の脚を、ウエストから裾までのプロファイルを回転体(Lathe)で構築する。skirt.ts と同じ
 * smoothstep イージング/反転の手法。 */
function buildLegGeometry(
  waistRadius: number,
  hemRadius: number,
  inseam: number,
  segments: number,
): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= PROFILE_STEPS; i++) {
    const t = i / PROFILE_STEPS; // ウエストで0、裾で1
    const eased = t * t * (3 - 2 * t);
    const radius = waistRadius + (hemRadius - waistRadius) * eased;
    const y = -t * inseam;
    points.push(new THREE.Vector2(radius, y));
  }
  points.reverse(); // skirt.ts と同じ理由(Lathe が下→上のプロファイルを期待する)で反転
  return new THREE.LatheGeometry(points, segments);
}

/** 左右2本の脚のジオメトリを1つの BufferGeometry にまとめる。sleeve.ts が左右の肩のチューブを
 * 1つのジオメトリにまとめているのと同じアプローチ。各脚は独立した LatheGeometry を平行移動
 * したものなので、skirt.ts で確認済みの巻き順がそのまま保たれる(平行移動は巻き順に影響しない)。 */
export function buildPantsGeometry(params: PantsParams): THREE.BufferGeometry {
  const { waistRadius, hemRadius, inseam, legSpacing, segments } = params;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const side of [-1, 1]) {
    const leg = buildLegGeometry(waistRadius, hemRadius, inseam, segments);
    leg.translate(side * legSpacing, 0, 0);

    const legPositions = leg.getAttribute('position').array as Float32Array;
    const legIndex = leg.getIndex()!;
    const baseIndex = positions.length / 3;

    for (let i = 0; i < legPositions.length; i++) positions.push(legPositions[i]);
    for (let i = 0; i < legIndex.count; i++) indices.push(baseIndex + legIndex.getX(i));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
