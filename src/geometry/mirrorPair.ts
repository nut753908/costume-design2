import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * 左右対称な2つのパーツ(脚・靴・手袋など)を build() でそれぞれ独立に構築し、±offset だけ
 * X方向に平行移動して1つの BufferGeometry にまとめる。平行移動は巻き順に影響しないため、
 * build() が返すジオメトリの巻き順(LatheGeometry 由来)がそのまま保たれる。
 */
export function buildMirroredPairGeometry(
  build: () => THREE.BufferGeometry,
  offset: number,
): THREE.BufferGeometry {
  const parts = [-1, 1].map((side) => build().translate(side * offset, 0, 0));
  const merged = mergeGeometries(parts)!;
  merged.computeVertexNormals();
  return merged;
}
