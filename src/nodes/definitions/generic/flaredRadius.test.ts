import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function hemRadius(radius: number, flare: number): number | undefined {
  const result = getNodeType('flaredRadius').evaluate({ radius: num(radius), flare: num(flare) }, {});
  return result.value?.type === 'number' ? result.value.value : undefined;
}

describe('flaredRadius', () => {
  it('裾半径 = 基準半径 × (1 + フレア)', () => {
    expect(hemRadius(0.3, 0.7)).toBeCloseTo(0.3 * 1.7, 10);
  });

  it('フレアが 0 なら基準半径のまま', () => {
    expect(hemRadius(0.3, 0)).toBeCloseTo(0.3, 10);
  });

  it('負のフレアは 0 として扱う(基準半径より小さくならない)', () => {
    expect(hemRadius(0.3, -0.5)).toBeCloseTo(0.3, 10);
  });
});
