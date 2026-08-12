import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildGlassesGeometry, type GlassesParams } from './glasses';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE: GlassesParams = {
  lensRadius: 0.045,
  frameThickness: 0.008,
  lensSpacing: 0.055,
  bridgeThickness: 0.01,
  templeLength: 0.12,
  templeThickness: 0.006,
};

const FORWARD_DEPTH = 0.14;
const TEMPLE_BACK_DEPTH = FORWARD_DEPTH - 0.02;
const TORUS_INDEX_COUNT = 8 * 16 * 2 * 3; // radialSegments(8) * tubularSegments(16) * 2三角形 * 3

function positions(geometry: THREE.BufferGeometry): Float32Array {
  return geometry.getAttribute('position').array as Float32Array;
}

describe('buildGlassesGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildGlassesGeometry(BASE);
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    expect(index!.count).toBeGreaterThan(0);

    const pos = positions(geometry);
    expect(pos.length).toBeGreaterThan(0);
    for (let i = 0; i < pos.length; i++) {
      expect(Number.isNaN(pos[i])).toBe(false);
    }
  });

  it('X方向に鏡像となる左右のレンズを持つ', () => {
    const geometry = buildGlassesGeometry(BASE);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.max.x).toBeGreaterThan(0);
    expect(box.min.x).toBeLessThan(0);
    expect(box.max.x).toBeCloseTo(-box.min.x, 5);
  });

  it('lensSpacing が広がるほど左右のレンズの間隔も広がる', () => {
    const narrow = buildGlassesGeometry({ ...BASE, lensSpacing: 0.04 });
    const wide = buildGlassesGeometry({ ...BASE, lensSpacing: 0.1 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('lensRadius が大きくなるほどレンズが広がる', () => {
    const small = buildGlassesGeometry({ ...BASE, lensRadius: 0.03 });
    const large = buildGlassesGeometry({ ...BASE, lensRadius: 0.08 });
    small.computeBoundingBox();
    large.computeBoundingBox();
    expect(large.boundingBox!.max.x).toBeGreaterThan(small.boundingBox!.max.x);
  });

  it('templeLength が長くなるほどテンプル(つる)が後方(-Z)に伸びる', () => {
    const short = buildGlassesGeometry({ ...BASE, templeLength: 0.05 });
    const long = buildGlassesGeometry({ ...BASE, templeLength: 0.3 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.z).toBeLessThan(short.boundingBox!.min.z);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    // レンズ(TorusGeometry)は「中心点」からは放射状ではない(ドーナツの中心軸に対しては
    // 内側の管壁が中心へ向く)。トーラス表面が真に放射状になるのは、中心線円(半径
    // lensRadius)上の最近点を基準にしたときだけなので、その点を axisPoint として与える。
    // ブリッジ/テンプルは alignedBox の直方体なので、自身の中心点で判定できる(bag.test.ts
    // と同様)。
    const leftCenter = new THREE.Vector3(BASE.lensSpacing, 0, FORWARD_DEPTH);
    const rightCenter = new THREE.Vector3(-BASE.lensSpacing, 0, FORWARD_DEPTH);
    const nearestOnRim = (torusCenter: THREE.Vector3, centroid: THREE.Vector3): THREE.Vector3 => {
      const dx = centroid.x - torusCenter.x;
      const dy = centroid.y - torusCenter.y;
      const len = Math.hypot(dx, dy) || 1;
      return new THREE.Vector3(
        torusCenter.x + (dx / len) * BASE.lensRadius,
        torusCenter.y + (dy / len) * BASE.lensRadius,
        torusCenter.z,
      );
    };

    const bridgeCenter = new THREE.Vector3(0, 0, FORWARD_DEPTH);
    const leftTempleCenter = new THREE.Vector3(
      BASE.lensSpacing + BASE.lensRadius,
      0,
      (FORWARD_DEPTH + TEMPLE_BACK_DEPTH - BASE.templeLength) / 2,
    );
    const rightTempleCenter = new THREE.Vector3(
      -(BASE.lensSpacing + BASE.lensRadius),
      0,
      (FORWARD_DEPTH + TEMPLE_BACK_DEPTH - BASE.templeLength) / 2,
    );

    const lensIndexCount = TORUS_INDEX_COUNT * 2;
    const bridgeIndexCount = 36; // BoxGeometry は既定で36 indices
    const leftTempleIndexCount = 36;

    expectOutwardWinding(buildGlassesGeometry(BASE), (centroid, i) => {
      if (i < TORUS_INDEX_COUNT) return nearestOnRim(leftCenter, centroid);
      if (i < lensIndexCount) return nearestOnRim(rightCenter, centroid);
      if (i < lensIndexCount + bridgeIndexCount) return bridgeCenter;
      if (i < lensIndexCount + bridgeIndexCount + leftTempleIndexCount) return leftTempleCenter;
      return rightTempleCenter;
    });
  });
});
