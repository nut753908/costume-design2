import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function evaluateBox(inputs: Record<string, number>) {
  const result = getNodeType('limbPair').evaluate(
    Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)])),
    {},
  );
  const geometry = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
  geometry!.computeBoundingBox();
  return geometry!.boundingBox!;
}

describe('limbPair', () => {
  const base = { radius: 0.1, length: 0.6, spacing: 0.3, centerY: 1, taperRatio: 0.5 };

  it('左右対称に ±spacing へ置かれ、根元の半径ぶん外側へ広がる', () => {
    const box = evaluateBox(base);
    expect(box.max.x).toBeCloseTo(0.3 + 0.1, 3);
    expect(box.min.x).toBeCloseTo(-(0.3 + 0.1), 3);
  });

  it('centerY を中心に length だけ縦に広がり、上端には radius の球(関節)が乗る', () => {
    const box = evaluateBox(base);
    expect(box.min.y).toBeCloseTo(1 - 0.3, 5);
    expect(box.max.y).toBeCloseTo(1 + 0.3 + 0.1, 5);
  });

  it('taperRatio は先端側(radiusBottom)だけを細くし、根元の広がりには影響しない', () => {
    const tapered = evaluateBox(base);
    const straight = evaluateBox({ ...base, taperRatio: 1 });
    expect(tapered.max.x).toBeCloseTo(straight.max.x, 5);
    expect(tapered.min.x).toBeCloseTo(straight.min.x, 5);
  });
});
