import { describe, expect, it } from 'vitest';
import { buildSleeveGeometry } from './sleeve';

const BASE = { attachRadius: 0.3, sleeveRadius: 0.085, segments: 12 } as const;

describe('buildSleeveGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildSleeveGeometry({ ...BASE, sleeveLength: 0.22 });
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

  it('X方向に鏡像となる2本のチューブ(右+左)を生成する', () => {
    const geometry = buildSleeveGeometry({ ...BASE, sleeveLength: 0.22 });
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    // 中心軸に対して対称: 両側でおおよそ同じ広がりを持つ。
    expect(box.max.x).toBeGreaterThan(0);
    expect(box.min.x).toBeLessThan(0);
    expect(box.max.x).toBeCloseTo(-box.min.x, 1);
  });

  it('sleeveLength が長くなるほど外側に伸びる', () => {
    const short = buildSleeveGeometry({ ...BASE, sleeveLength: 0.05 });
    const long = buildSleeveGeometry({ ...BASE, sleeveLength: 0.4 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.max.x).toBeGreaterThan(short.boundingBox!.max.x);
  });

  it('sleeveLength が長くなるほど(垂れ下がって)低い位置になる', () => {
    const short = buildSleeveGeometry({ ...BASE, sleeveLength: 0.05 });
    const long = buildSleeveGeometry({ ...BASE, sleeveLength: 0.4 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('指定した segments に対して期待通りの頂点数になる', () => {
    const geometry = buildSleeveGeometry({ ...BASE, sleeveLength: 0.22 });
    const vertexCount = geometry.getAttribute('position').count;
    // 2チューブ * 2行 * (segments + 1) 列
    expect(vertexCount).toBe(2 * 2 * (BASE.segments + 1));
  });
});
