import { describe, expect, it } from 'vitest';
import { evaluateGraph } from '../evaluateGraph';
import { necklineShapes } from './garmentParts';
import './index';

describe('necklineShapes', () => {
  const { nodes, edges } = necklineShapes();
  const results = evaluateGraph(nodes, edges);
  const weights = (id: string) => {
    const out = results.get(id)?.points;
    if (out?.type !== 'points') throw new Error(`${id} が points を出力していない`);
    return out.value;
  };

  it.each([
    ['squareShape', () => 1],
    ['vShape', (t: number) => 1 - t],
    ['roundShape', (t: number) => 1 - t * t],
  ])('%s は角度 t(0〜1)に対する落ち込み量の曲線になる', (id, f) => {
    const points = weights(id);
    expect(points.length).toBe(13);
    for (const p of points) {
      expect(p.y).toBeCloseTo(f(p.x), 10);
    }
  });

  it('どの形も x は 0〜1 の昇順', () => {
    for (const id of ['squareShape', 'vShape', 'roundShape']) {
      const xs = weights(id).map((p) => p.x);
      expect(xs[0]).toBe(0);
      expect(xs[xs.length - 1]).toBe(1);
      expect(xs).toEqual([...xs].sort((a, b) => a - b));
    }
  });
});
