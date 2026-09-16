import { describe, expect, it } from 'vitest';
import { buildPantsLegGeometry } from './pants';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = { waistRadius: 0.16, hemRadius: 0.1, segments: 12 } as const;

// 左右の結合(mirrorPair)はこのファイルの責務ではなくなったため、脚1本だけを検証する
// (鏡像ペアの間隔テストは src/nodes/definitions/mirrorPair.test.ts が既にカバーしている)。
describe('buildPantsLegGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildPantsLegGeometry({ ...BASE, inseam: 0.75 });
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

  it('inseam が長くなるほど下方向に伸びる', () => {
    const short = buildPantsLegGeometry({ ...BASE, inseam: 0.3 });
    const long = buildPantsLegGeometry({ ...BASE, inseam: 1.0 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('hemRadius が大きくなるほど裾が広がる', () => {
    const narrow = buildPantsLegGeometry({ ...BASE, inseam: 0.75, hemRadius: 0.05 });
    const wide = buildPantsLegGeometry({ ...BASE, inseam: 0.75, hemRadius: 0.4 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildPantsLegGeometry({ ...BASE, inseam: 0.75, segments: 8 });
    const fine = buildPantsLegGeometry({ ...BASE, inseam: 0.75, segments: 32 });
    expect(fine.getAttribute('position').count).toBeGreaterThan(coarse.getAttribute('position').count);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    expectOutwardWinding(buildPantsLegGeometry({ ...BASE, inseam: 0.75 }));
  });
});
