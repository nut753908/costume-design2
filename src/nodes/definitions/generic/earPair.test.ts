import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './earPair';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function evaluateBox(inputs: Record<string, number>) {
  const result = getNodeType('earPair').evaluate(Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)])), {});
  const geometry = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
  geometry!.computeBoundingBox();
  return geometry!.boundingBox!;
}

describe('earPair', () => {
  const base = { radius: 0.3, centerY: 1.5, centerZ: -0.1 };

  it('頭の中心から左右に ±radius × 0.777 の位置へ、左右対称に置かれる', () => {
    const box = evaluateBox(base);
    expect(box.max.x).toBeGreaterThan(0.3 * 0.777);
    expect(box.min.x).toBeCloseTo(-box.max.x, 5);
  });

  it('頭の中心より下(あごに近い高さ)・やや後ろに置かれる', () => {
    const box = evaluateBox(base);
    const centerY = (box.min.y + box.max.y) / 2;
    const centerZ = (box.min.z + box.max.z) / 2;
    expect(centerY).toBeLessThan(1.5);
    expect(centerY).toBeGreaterThan(1.5 - 0.3);
    expect(centerZ).toBeLessThan(-0.1);
  });

  it('頭の半径に比例して、位置も大きさも相似に変わる', () => {
    const small = evaluateBox({ radius: 0.15, centerY: 0, centerZ: 0 });
    const large = evaluateBox({ radius: 0.3, centerY: 0, centerZ: 0 });
    expect(large.max.x).toBeCloseTo(small.max.x * 2, 5);
    expect(large.max.y - large.min.y).toBeCloseTo((small.max.y - small.min.y) * 2, 5);
  });
});
