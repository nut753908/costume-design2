import { describe, expect, it } from 'vitest';
import { buildGloveGeometry } from './gloves';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = { wristRadius: 0.08, handRadius: 0.09, segments: 12 } as const;

// 左右の結合(mirrorPair)はこのファイルの責務ではなくなったため、手袋1つだけを検証する
// (鏡像ペアの間隔テストは src/nodes/definitions/mirrorPair.test.ts が既にカバーしている)。
describe('buildGloveGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildGloveGeometry({ ...BASE, length: 0.14 });
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

  it('length が長くなるほど下方向に伸びる', () => {
    const short = buildGloveGeometry({ ...BASE, length: 0.05 });
    const long = buildGloveGeometry({ ...BASE, length: 0.3 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('handRadius が大きくなるほど指先側が広がる', () => {
    const narrow = buildGloveGeometry({ ...BASE, length: 0.14, handRadius: 0.06 });
    const wide = buildGloveGeometry({ ...BASE, length: 0.14, handRadius: 0.2 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildGloveGeometry({ ...BASE, length: 0.14, segments: 8 });
    const fine = buildGloveGeometry({ ...BASE, length: 0.14, segments: 32 });
    expect(fine.getAttribute('position').count).toBeGreaterThan(coarse.getAttribute('position').count);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    expectOutwardWinding(buildGloveGeometry({ ...BASE, length: 0.14 }));
  });
});
