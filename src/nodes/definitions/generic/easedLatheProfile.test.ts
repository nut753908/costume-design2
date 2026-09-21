import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../../registry';
import * as latheProfile from '../../../geometry/latheProfile';
import './easedLatheProfile';

const num = (value: number) => ({ type: 'number' as const, value });
const numbers = { startRadius: num(0.2), endRadius: num(0.4), distance: num(0.6) };

function pointsOf(result: ReturnType<ReturnType<typeof getNodeType>['evaluate']>, id: 'up' | 'down') {
  const out = result[id];
  if (out?.type !== 'points') throw new Error(`${id} が points を出力していない`);
  return out.value;
}

describe('easedLatheProfile', () => {
  it('各入力を取り違えずに、上向き・下向きの両方で buildEasedLatheProfile へ渡す', () => {
    const spy = vi.spyOn(latheProfile, 'buildEasedLatheProfile');
    try {
      getNodeType('easedLatheProfile').evaluate({ ...numbers, steps: num(8) }, {});
      expect(spy).toHaveBeenCalledWith(0.2, 0.4, 0.6, 'up', 8);
      expect(spy).toHaveBeenCalledWith(0.2, 0.4, 0.6, 'down', 8);
    } finally {
      spy.mockRestore();
    }
  });

  it('未接続の startRadius/endRadius/distance は0、steps は 10 にフォールバックする', () => {
    const points = pointsOf(getNodeType('easedLatheProfile').evaluate({}, {}), 'down');
    expect(points).toHaveLength(11);
    expect(points[0]).toBeInstanceOf(THREE.Vector2);
  });

  it('Up はアンカー(y=0)から上へ、Down は下へ伸び、どちらも下(小さい y)→上の順に並ぶ', () => {
    const result = getNodeType('easedLatheProfile').evaluate(numbers, {});
    const up = pointsOf(result, 'up');
    const down = pointsOf(result, 'down');
    expect(up[0]!.y).toBeCloseTo(0);
    expect(up[up.length - 1]!.y).toBeCloseTo(0.6);
    expect(down[0]!.y).toBeCloseTo(-0.6);
    expect(down[down.length - 1]!.y).toBeCloseTo(0);
    for (const points of [up, down]) {
      const ys = points.map((p) => p.y);
      expect(ys).toEqual([...ys].sort((a, b) => a - b));
    }
  });

  it('出力する points の数は steps+1 個', () => {
    const result = getNodeType('easedLatheProfile').evaluate({ ...numbers, steps: num(5) }, {});
    expect(pointsOf(result, 'up')).toHaveLength(6);
    expect(pointsOf(result, 'down')).toHaveLength(6);
  });
});
