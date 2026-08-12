import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildShoesGeometry } from './shoes';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = { soleRadius: 0.13, cuffRadius: 0.1, height: 0.12, toeLength: 1.5, legSpacing: 0.14, segments: 16 } as const;

// 左右2つの靴は legSpacing だけ X方向にずらされているため、Y軸ではなくそれぞれの靴自身の
// 中心軸(x=±legSpacing)を基準に外向きかどうかを判定する。toeLength による Z方向の
// 非一様スケールは正の係数なのでループの向き(≒外向き/内向きの符号)自体は変えない。
// mirrorPair.ts が build([-1,1]) の順に結合していることを利用して index 配列の前半/後半で
// 左右を判定する(pants.test.ts と同様)。
function shoeAxisPoint(centroid: THREE.Vector3, i: number, totalIndexCount: number): THREE.Vector3 {
  const side = i < totalIndexCount / 2 ? -1 : 1;
  return new THREE.Vector3(side * BASE.legSpacing, centroid.y, 0);
}

describe('buildShoesGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildShoesGeometry({ ...BASE });
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

  it('X方向に鏡像となる2つの靴(右+左)を生成する', () => {
    const geometry = buildShoesGeometry({ ...BASE });
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.max.x).toBeGreaterThan(0);
    expect(box.min.x).toBeLessThan(0);
    expect(box.max.x).toBeCloseTo(-box.min.x, 5);
  });

  it('地面(y=0)からくるぶし(y=height)まで積み上がる', () => {
    const geometry = buildShoesGeometry({ ...BASE });
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.y).toBeCloseTo(0, 5);
    expect(geometry.boundingBox!.max.y).toBeCloseTo(BASE.height, 5);
  });

  it('toeLength が大きくなるほどZ方向(前後)に伸びる', () => {
    const short = buildShoesGeometry({ ...BASE, toeLength: 1.0 });
    const long = buildShoesGeometry({ ...BASE, toeLength: 2.0 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.max.z).toBeGreaterThan(short.boundingBox!.max.z);
  });

  it('legSpacing が広がるほど2つの靴の間隔も広がる', () => {
    const narrow = buildShoesGeometry({ ...BASE, legSpacing: 0.1 });
    const wide = buildShoesGeometry({ ...BASE, legSpacing: 0.3 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildShoesGeometry({ ...BASE, segments: 8 });
    const fine = buildShoesGeometry({ ...BASE, segments: 32 });
    expect(fine.getAttribute('position').count).toBeGreaterThan(coarse.getAttribute('position').count);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    expectOutwardWinding(buildShoesGeometry({ ...BASE }), shoeAxisPoint);
  });
});
