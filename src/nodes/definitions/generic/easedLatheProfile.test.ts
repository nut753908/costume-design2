import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../../registry';
import * as latheProfile from '../../../geometry/latheProfile';
import './easedLatheProfile';

const num = (value: number) => ({ type: 'number' as const, value });
const numbers = { startRadius: num(0.2), endRadius: num(0.4), distance: num(0.6) };

describe('easedLatheProfile', () => {
  it('各入力を取り違えずに buildEasedLatheProfile へ渡す', () => {
    const spy = vi.spyOn(latheProfile, 'buildEasedLatheProfile');
    try {
      getNodeType('easedLatheProfile').evaluate({ ...numbers, direction: num(1), steps: num(8) }, {});
      expect(spy).toHaveBeenCalledWith(0.2, 0.4, 0.6, 'up', 8);
    } finally {
      spy.mockRestore();
    }
  });

  it('未接続の startRadius/endRadius/distance は0にフォールバックする', () => {
    const result = getNodeType('easedLatheProfile').evaluate({}, {});
    const points = result.points?.type === 'points' ? result.points.value : undefined;
    expect(points).toBeDefined();
    expect(points![0]).toBeInstanceOf(THREE.Vector2);
  });

  it('未接続の direction は下向き(-1)、steps は 10 にフォールバックする', () => {
    const spy = vi.spyOn(latheProfile, 'buildEasedLatheProfile');
    try {
      getNodeType('easedLatheProfile').evaluate({}, {});
      expect(spy).toHaveBeenCalledWith(0, 0, 0, 'down', 10);
    } finally {
      spy.mockRestore();
    }
  });

  it('direction は負なら下向き、0以上なら上向きになる', () => {
    const spy = vi.spyOn(latheProfile, 'buildEasedLatheProfile');
    try {
      getNodeType('easedLatheProfile').evaluate({ ...numbers, direction: num(-1) }, {});
      getNodeType('easedLatheProfile').evaluate({ ...numbers, direction: num(1) }, {});
      expect(spy.mock.calls.map((c) => c[3])).toEqual(['down', 'up']);
    } finally {
      spy.mockRestore();
    }
  });

  it('出力する points の数は steps+1 個', () => {
    const result = getNodeType('easedLatheProfile').evaluate({ ...numbers, steps: num(5) }, {});
    const points = result.points?.type === 'points' ? result.points.value : undefined;
    expect(points).toHaveLength(6);
  });
});
