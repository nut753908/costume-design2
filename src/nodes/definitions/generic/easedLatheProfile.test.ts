import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../../registry';
import * as latheProfile from '../../../geometry/latheProfile';
import './easedLatheProfile';

describe('easedLatheProfile', () => {
  it('data の各フィールドを取り違えずに buildEasedLatheProfile へ渡す', () => {
    const spy = vi.spyOn(latheProfile, 'buildEasedLatheProfile');
    try {
      getNodeType('easedLatheProfile').evaluate(
        {
          startRadius: { type: 'number', value: 0.2 },
          endRadius: { type: 'number', value: 0.4 },
          distance: { type: 'number', value: 0.6 },
        },
        { direction: 'up', steps: 8 },
      );
      expect(spy).toHaveBeenCalledWith(0.2, 0.4, 0.6, 'up', 8);
    } finally {
      spy.mockRestore();
    }
  });

  it('未接続の startRadius/endRadius/distance は0にフォールバックする', () => {
    const result = getNodeType('easedLatheProfile').evaluate({}, { direction: 'down', steps: 10 });
    const points = result.points?.type === 'points' ? result.points.value : undefined;
    expect(points).toBeDefined();
    expect(points![0]).toBeInstanceOf(THREE.Vector2);
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('easedLatheProfile').createDefaultData()).toEqual({ direction: -1, steps: 10 });
  });

  it('出力する points の数は steps+1 個', () => {
    const result = getNodeType('easedLatheProfile').evaluate(
      { startRadius: { type: 'number', value: 0.1 }, endRadius: { type: 'number', value: 0.2 }, distance: { type: 'number', value: 0.5 } },
      { direction: 'down', steps: 5 },
    );
    const points = result.points?.type === 'points' ? result.points.value : undefined;
    expect(points).toHaveLength(6);
  });

  const numbers = { startRadius: { type: 'number', value: 0.2 }, endRadius: { type: 'number', value: 0.4 }, distance: { type: 'number', value: 0.6 } } as const;

  it('入力ソケット direction は負なら下向き、0以上なら上向きになる', () => {
    const spy = vi.spyOn(latheProfile, 'buildEasedLatheProfile');
    try {
      getNodeType('easedLatheProfile').evaluate({ ...numbers, direction: { type: 'number', value: -1 } }, { direction: -1, steps: 10 });
      getNodeType('easedLatheProfile').evaluate({ ...numbers, direction: { type: 'number', value: 1 } }, { direction: 1, steps: 10 });
      expect(spy.mock.calls.map((c) => c[3])).toEqual(['down', 'up']);
    } finally {
      spy.mockRestore();
    }
  });

  it('入力ソケット steps が点の数(steps+1)を決める', () => {
    const result = getNodeType('easedLatheProfile').evaluate({ ...numbers, steps: { type: 'number', value: 3 } }, { direction: -1, steps: 10 });
    expect(result.points?.type === 'points' ? result.points.value : []).toHaveLength(4);
  });

  it('旧データ(direction が "up"/"down" の文字列)もそのまま解釈する', () => {
    const spy = vi.spyOn(latheProfile, 'buildEasedLatheProfile');
    try {
      getNodeType('easedLatheProfile').evaluate({ ...numbers, direction: { type: 'number', value: -1 } }, { direction: 'up', steps: 10 });
      expect(spy.mock.calls[0]?.[3]).toBe('up');
    } finally {
      spy.mockRestore();
    }
  });
});
