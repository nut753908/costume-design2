import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

describe('necklineShapes', () => {
  const results = getNodeType('necklineShapes').evaluate({}, {});
  const weight = (id: string, t: number) => {
    const out = results[id];
    if (out?.type !== 'curve') throw new Error(`${id} が curve を出力していない`);
    return out.value.getPoint(t).y;
  };

  it.each([
    ['squareShape', () => 1],
    ['vShape', (t: number) => 1 - t],
    ['roundShape', (t: number) => 1 - t * t],
  ])('%s は角度 t(0〜1)に対する落ち込み量の曲線になる(分割せず任意の t で厳密に評価できる)', (id, f) => {
    for (const t of [0, 0.1, 0.37, 0.5, 0.9, 1]) {
      expect(weight(id, t)).toBeCloseTo(f(t), 12);
    }
  });

  it('どの形も x は t と一致する', () => {
    for (const id of ['squareShape', 'vShape', 'roundShape']) {
      const out = results[id];
      if (out?.type !== 'curve') throw new Error(`${id} が curve を出力していない`);
      for (const t of [0, 0.25, 1]) expect(out.value.getPoint(t).x).toBe(t);
    }
  });
});
