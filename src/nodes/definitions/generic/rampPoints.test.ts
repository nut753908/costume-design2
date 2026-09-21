import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './rampPoints';

const steps = (value: number) => ({ steps: { type: 'number' as const, value } });

describe('rampPoints', () => {
  it('x=y=0〜1 を steps 分割した steps+1 個の点を出力する', () => {
    const result = getNodeType('rampPoints').evaluate(steps(4), {});
    const points = result.points?.type === 'points' ? result.points.value : [];
    expect(points.map((p) => [p.x, p.y])).toEqual([
      [0, 0],
      [0.25, 0.25],
      [0.5, 0.5],
      [0.75, 0.75],
      [1, 1],
    ]);
  });

  it('steps が1未満でも最低1分割(2点)になる', () => {
    const result = getNodeType('rampPoints').evaluate(steps(0), {});
    expect(result.points?.type === 'points' ? result.points.value.length : 0).toBe(2);
  });

  it('未接続の steps は12にフォールバックする', () => {
    const result = getNodeType('rampPoints').evaluate({}, {});
    expect(result.points?.type === 'points' ? result.points.value.length : 0).toBe(13);
  });
});
