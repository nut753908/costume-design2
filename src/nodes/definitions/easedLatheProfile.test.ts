import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../registry';
import * as latheProfile from '../../geometry/latheProfile';
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
    expect(getNodeType('easedLatheProfile').createDefaultData()).toEqual({ direction: 'down', steps: 10 });
  });

  it('出力する points の数は steps+1 個', () => {
    const result = getNodeType('easedLatheProfile').evaluate(
      { startRadius: { type: 'number', value: 0.1 }, endRadius: { type: 'number', value: 0.2 }, distance: { type: 'number', value: 0.5 } },
      { direction: 'down', steps: 5 },
    );
    const points = result.points?.type === 'points' ? result.points.value : undefined;
    expect(points).toHaveLength(6);
  });
});
