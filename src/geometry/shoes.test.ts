import { describe, expect, it } from 'vitest';
import { buildShoesGeometry } from './shoes';

const BASE = { soleRadius: 0.13, cuffRadius: 0.1, height: 0.12, toeLength: 1.5, legSpacing: 0.14, segments: 16 } as const;

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
});
