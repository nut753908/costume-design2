import { describe, expect, it } from 'vitest';
import { buildPantsGeometry } from './pants';

const BASE = { waistRadius: 0.16, hemRadius: 0.1, legSpacing: 0.14, segments: 12 } as const;

describe('buildPantsGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildPantsGeometry({ ...BASE, inseam: 0.75 });
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

  it('X方向に鏡像となる2本の脚(右+左)を生成する', () => {
    const geometry = buildPantsGeometry({ ...BASE, inseam: 0.75 });
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.max.x).toBeGreaterThan(0);
    expect(box.min.x).toBeLessThan(0);
    expect(box.max.x).toBeCloseTo(-box.min.x, 5);
  });

  it('legSpacing が広がるほど2本の脚の間隔も広がる', () => {
    const narrow = buildPantsGeometry({ ...BASE, inseam: 0.75, legSpacing: 0.1 });
    const wide = buildPantsGeometry({ ...BASE, inseam: 0.75, legSpacing: 0.3 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('inseam が長くなるほど下方向に伸びる', () => {
    const short = buildPantsGeometry({ ...BASE, inseam: 0.3 });
    const long = buildPantsGeometry({ ...BASE, inseam: 1.0 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('hemRadius が大きくなるほど裾が広がる', () => {
    const narrow = buildPantsGeometry({ ...BASE, inseam: 0.75, hemRadius: 0.05 });
    const wide = buildPantsGeometry({ ...BASE, inseam: 0.75, hemRadius: 0.4 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildPantsGeometry({ ...BASE, inseam: 0.75, segments: 8 });
    const fine = buildPantsGeometry({ ...BASE, inseam: 0.75, segments: 32 });
    expect(fine.getAttribute('position').count).toBeGreaterThan(coarse.getAttribute('position').count);
  });
});
