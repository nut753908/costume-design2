import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildGlovesGeometry } from './gloves';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = { wristRadius: 0.08, handRadius: 0.09, armSpacing: 0.34, segments: 12 } as const;

// 左右2つの手袋は armSpacing だけ X方向にずらされているため、Y軸ではなくそれぞれの手袋自身の
// 中心軸(x=±armSpacing)を基準に外向きかどうかを判定する。mirrorPair.ts が build([-1,1]) の
// 順に結合していることを利用して index 配列の前半/後半で左右を判定する(pants.test.ts と同様)。
function gloveAxisPoint(centroid: THREE.Vector3, i: number, totalIndexCount: number): THREE.Vector3 {
  const side = i < totalIndexCount / 2 ? -1 : 1;
  return new THREE.Vector3(side * BASE.armSpacing, centroid.y, 0);
}

describe('buildGlovesGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildGlovesGeometry({ ...BASE, length: 0.14 });
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

  it('X方向に鏡像となる2つの手袋(右+左)を生成する', () => {
    const geometry = buildGlovesGeometry({ ...BASE, length: 0.14 });
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.max.x).toBeGreaterThan(0);
    expect(box.min.x).toBeLessThan(0);
    expect(box.max.x).toBeCloseTo(-box.min.x, 5);
  });

  it('length が長くなるほど下方向に伸びる', () => {
    const short = buildGlovesGeometry({ ...BASE, length: 0.05 });
    const long = buildGlovesGeometry({ ...BASE, length: 0.3 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('armSpacing が広がるほど2つの手袋の間隔も広がる', () => {
    const narrow = buildGlovesGeometry({ ...BASE, length: 0.14, armSpacing: 0.2 });
    const wide = buildGlovesGeometry({ ...BASE, length: 0.14, armSpacing: 0.4 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('handRadius が大きくなるほど指先側が広がる', () => {
    const narrow = buildGlovesGeometry({ ...BASE, length: 0.14, handRadius: 0.06 });
    const wide = buildGlovesGeometry({ ...BASE, length: 0.14, handRadius: 0.2 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildGlovesGeometry({ ...BASE, length: 0.14, segments: 8 });
    const fine = buildGlovesGeometry({ ...BASE, length: 0.14, segments: 32 });
    expect(fine.getAttribute('position').count).toBeGreaterThan(coarse.getAttribute('position').count);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    expectOutwardWinding(buildGlovesGeometry({ ...BASE, length: 0.14 }), gloveAxisPoint);
  });
});
