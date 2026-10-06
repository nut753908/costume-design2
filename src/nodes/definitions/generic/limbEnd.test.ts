import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './limbEnd';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function evaluateBox(inputs: Record<string, number>) {
  const result = getNodeType('limbEnd').evaluate(Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)])), {});
  const geometry = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
  geometry!.computeBoundingBox();
  return geometry!.boundingBox!;
}

describe('limbEnd', () => {
  it('既定では中心が原点の、半径 radius × ratio の球', () => {
    const box = evaluateBox({ radius: 0.1, ratio: 1.2 });
    expect(box.max.x).toBeCloseTo(0.12, 5);
    expect(box.min.y).toBeCloseTo(-0.12, 5);
  });

  it('scaleY で上下につぶし、shiftY/shiftZ は球の半径を単位に中心をずらす', () => {
    const box = evaluateBox({ radius: 0.1, ratio: 1.2, scaleY: 0.5, shiftY: 0.5, shiftZ: 1 });
    expect(box.max.z).toBeCloseTo(0.12 + 0.12, 5);
    expect(box.max.y).toBeCloseTo(0.06 + 0.06, 5);
  });

  it('shiftX は外側(+X)へずらし、roll は左右へ傾ける', () => {
    const flat = evaluateBox({ radius: 0.1, ratio: 1.2, scaleX: 2, scaleY: 0.5 });
    expect(evaluateBox({ radius: 0.1, ratio: 1.2, scaleX: 2, scaleY: 0.5, shiftX: 1 }).max.x).toBeCloseTo(flat.max.x + 0.12, 5);
    expect(evaluateBox({ radius: 0.1, ratio: 1.2, scaleX: 2, scaleY: 0.5, roll: 90 }).min.y).toBeLessThan(flat.min.y - 0.05);
  });
});
