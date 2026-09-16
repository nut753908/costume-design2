import { describe, expect, it } from 'vitest';
import { buildShoeGeometry } from './shoes';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = { soleRadius: 0.13, cuffRadius: 0.1, height: 0.12, toeLength: 1.5, segments: 16 } as const;

// 左右の結合(mirrorPair)はこのファイルの責務ではなくなったため、靴1本だけを検証する
// (鏡像ペアの間隔テストは src/nodes/definitions/mirrorPair.test.ts が既にカバーしている)。
describe('buildShoeGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildShoeGeometry({ ...BASE });
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

  it('地面(y=0)からくるぶし(y=height)まで積み上がる', () => {
    const geometry = buildShoeGeometry({ ...BASE });
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.y).toBeCloseTo(0, 5);
    expect(geometry.boundingBox!.max.y).toBeCloseTo(BASE.height, 5);
  });

  it('toeLength が大きくなるほどZ方向(前後)に伸びる', () => {
    const short = buildShoeGeometry({ ...BASE, toeLength: 1.0 });
    const long = buildShoeGeometry({ ...BASE, toeLength: 2.0 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.max.z).toBeGreaterThan(short.boundingBox!.max.z);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildShoeGeometry({ ...BASE, segments: 8 });
    const fine = buildShoeGeometry({ ...BASE, segments: 32 });
    expect(fine.getAttribute('position').count).toBeGreaterThan(coarse.getAttribute('position').count);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    expectOutwardWinding(buildShoeGeometry({ ...BASE }));
  });
});
