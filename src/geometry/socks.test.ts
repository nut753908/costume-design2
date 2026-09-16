import { describe, expect, it } from 'vitest';
import { buildSockGeometry } from './socks';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = { ankleRadius: 0.09, calfRadius: 0.105, segments: 12 } as const;

// 左右の結合(mirrorPair)はこのファイルの責務ではなくなったため、靴下1本だけを検証する
// (鏡像ペアの間隔テストは src/nodes/definitions/mirrorPair.test.ts が既にカバーしている)。
describe('buildSockGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildSockGeometry({ ...BASE, height: 0.22 });
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

  it('height が高くなるほど上方向(ふくらはぎ側)に伸びる', () => {
    const short = buildSockGeometry({ ...BASE, height: 0.1 });
    const tall = buildSockGeometry({ ...BASE, height: 0.4 });
    short.computeBoundingBox();
    tall.computeBoundingBox();
    expect(tall.boundingBox!.max.y).toBeGreaterThan(short.boundingBox!.max.y);
  });

  it('calfRadius が大きくなるほどふくらはぎ側が広がる', () => {
    const narrow = buildSockGeometry({ ...BASE, height: 0.22, calfRadius: 0.08 });
    const wide = buildSockGeometry({ ...BASE, height: 0.22, calfRadius: 0.2 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildSockGeometry({ ...BASE, height: 0.22, segments: 8 });
    const fine = buildSockGeometry({ ...BASE, height: 0.22, segments: 32 });
    expect(fine.getAttribute('position').count).toBeGreaterThan(coarse.getAttribute('position').count);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    expectOutwardWinding(buildSockGeometry({ ...BASE, height: 0.22 }));
  });
});
