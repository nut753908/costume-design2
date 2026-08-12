import * as THREE from 'three';

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
 * 構築する。skirt.ts / pants.ts と同じ smoothstep イージング。ここではプロファイルを
 * y=0(地面、t=0)から y=height(履き口、t=1)へ「上向き」に構築するため、配列はすでに
 * 下→上の順になっており、skirt.ts / pants.ts と違って reverse() は不要
 * (Lathe が要求する巻き順の条件はどちらも同じ: 下→上の順であること)。 */
function buildShoeGeometry(
  soleRadius: number,
  cuffRadius: number,
  height: number,
  segments: number,
): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= PROFILE_STEPS; i++) {
    const t = i / PROFILE_STEPS; // 地面で0、履き口で1
    const eased = t * t * (3 - 2 * t);
    const radius = soleRadius + (cuffRadius - soleRadius) * eased;
    const y = t * height;
    points.push(new THREE.Vector2(radius, y));
  }
  return new THREE.LatheGeometry(points, segments);
}

/** 左右2つの靴のジオメトリを1つの BufferGeometry にまとめる。pants.ts と同じアプローチ
 * (独立した Lathe ジオメトリを平行移動して連結、平行移動は巻き順に影響しない)。回転体だけでは
 * 円形の断面にしかならないため、Z方向(前後)に非一様スケールしてつま先方向に伸びた
 * 靴らしい楕円形のシルエットにする。 */
export function buildShoesGeometry(params: ShoesParams): THREE.BufferGeometry {
  const { soleRadius, cuffRadius, height, toeLength, legSpacing, segments } = params;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const side of [-1, 1]) {
    const shoe = buildShoeGeometry(soleRadius, cuffRadius, height, segments);
    shoe.scale(1, 1, toeLength);
    shoe.translate(side * legSpacing, 0, 0);

    const shoePositions = shoe.getAttribute('position').array as Float32Array;
    const shoeIndex = shoe.getIndex()!;
    const baseIndex = positions.length / 3;

    for (let i = 0; i < shoePositions.length; i++) positions.push(shoePositions[i]);
    for (let i = 0; i < shoeIndex.count; i++) indices.push(baseIndex + shoeIndex.getX(i));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
