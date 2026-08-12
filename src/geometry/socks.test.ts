import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildSocksGeometry } from './socks';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = { ankleRadius: 0.09, calfRadius: 0.105, legSpacing: 0.14, segments: 12 } as const;

// 左右2本の靴下は legSpacing だけ X方向にずらされているため、Y軸ではなくそれぞれの
// 中心軸(x=±legSpacing)を基準に外向きかどうかを判定する(gloves.test.ts と同様)。
function sockAxisPoint(centroid: THREE.Vector3, i: number, totalIndexCount: number): THREE.Vector3 {
  const side = i < totalIndexCount / 2 ? -1 : 1;
  return new THREE.Vector3(side * BASE.legSpacing, centroid.y, 0);
}

describe('buildSocksGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildSocksGeometry({ ...BASE, height: 0.22 });
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    expect(index!.count).toBeGreaterThan(0);

    const pos = geometry.getAttribute('position').array as Float32Array;
    expect(pos.length).toBeGreaterThan(0);
    for (let i = 0; i < pos.length; i++) {
      expect(Number.isNaN(pos[i])).toBe(false);
    }
  });

  it('X方向に鏡像となる2本の靴下(右+左)を生成する', () => {
    const geometry = buildSocksGeometry({ ...BASE, height: 0.22 });
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.max.x).toBeGreaterThan(0);
    expect(box.min.x).toBeLessThan(0);
    expect(box.max.x).toBeCloseTo(-box.min.x, 5);
  });

  it('height が高くなるほど上方向(ふくらはぎ側)に伸びる', () => {
    const short = buildSocksGeometry({ ...BASE, height: 0.1 });
    const tall = buildSocksGeometry({ ...BASE, height: 0.4 });
    short.computeBoundingBox();
    tall.computeBoundingBox();
    expect(tall.boundingBox!.max.y).toBeGreaterThan(short.boundingBox!.max.y);
  });

  it('legSpacing が広がるほど2本の靴下の間隔も広がる', () => {
    const narrow = buildSocksGeometry({ ...BASE, height: 0.22, legSpacing: 0.1 });
    const wide = buildSocksGeometry({ ...BASE, height: 0.22, legSpacing: 0.3 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('calfRadius が大きくなるほどふくらはぎ側が広がる', () => {
    const narrow = buildSocksGeometry({ ...BASE, height: 0.22, calfRadius: 0.08 });
    const wide = buildSocksGeometry({ ...BASE, height: 0.22, calfRadius: 0.2 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildSocksGeometry({ ...BASE, height: 0.22, segments: 8 });
    const fine = buildSocksGeometry({ ...BASE, height: 0.22, segments: 32 });
    expect(fine.getAttribute('position').count).toBeGreaterThan(coarse.getAttribute('position').count);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    expectOutwardWinding(buildSocksGeometry({ ...BASE, height: 0.22 }), sockAxisPoint);
  });
});
