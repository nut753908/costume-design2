import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './scalePointsY';

describe('scalePointsY', () => {
  it('points の Y だけを factor 倍する', () => {
    const points = [new THREE.Vector2(0.1, 0.5), new THREE.Vector2(0.2, -1)];
    const result = getNodeType('scalePointsY').evaluate(
      { points: { type: 'points', value: points }, factor: { type: 'number', value: -2 } },
      {},
    );
    expect(result.points?.type === 'points' ? result.points.value : undefined).toEqual([
      new THREE.Vector2(0.1, -1),
      new THREE.Vector2(0.2, 2),
    ]);
  });

  it('元の points を変更しない', () => {
    const points = [new THREE.Vector2(0.1, 0.5)];
    getNodeType('scalePointsY').evaluate({ points: { type: 'points', value: points }, factor: { type: 'number', value: 3 } }, {});
    expect(points[0].y).toBe(0.5);
  });

  it('points が未接続なら何も返さない', () => {
    expect(getNodeType('scalePointsY').evaluate({ factor: { type: 'number', value: 1 } }, {}).points).toBeUndefined();
  });

  it('factor が未接続なら1にフォールバックする', () => {
    const result = getNodeType('scalePointsY').evaluate({ points: { type: 'points', value: [new THREE.Vector2(0, 0.5)] } }, {});
    expect(result.points?.type === 'points' ? result.points.value[0].y : undefined).toBe(0.5);
  });
});
