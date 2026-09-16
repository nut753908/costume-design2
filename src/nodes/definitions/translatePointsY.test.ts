import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './translatePointsY';

describe('translatePointsY', () => {
  it('points の各点を Y方向にだけ平行移動する', () => {
    const points = [new THREE.Vector2(0.1, 0), new THREE.Vector2(0.2, 0.5)];
    const result = getNodeType('translatePointsY').evaluate(
      { points: { type: 'points', value: points }, y: { type: 'number', value: -0.3 } },
      {},
    );
    const translated = result.points?.type === 'points' ? result.points.value : undefined;
    expect(translated).toEqual([new THREE.Vector2(0.1, -0.3), new THREE.Vector2(0.2, 0.2)]);
  });

  it('元の points を変更しない(独立したコピーを平行移動する)', () => {
    const points = [new THREE.Vector2(0.1, 0)];
    getNodeType('translatePointsY').evaluate({ points: { type: 'points', value: points }, y: { type: 'number', value: 1 } }, {});
    expect(points[0].y).toBe(0);
  });

  it('points が未接続なら何も返さない', () => {
    const result = getNodeType('translatePointsY').evaluate({ y: { type: 'number', value: 1 } }, {});
    expect(result.points).toBeUndefined();
  });

  it('y が未接続なら0にフォールバックする', () => {
    const points = [new THREE.Vector2(0.1, 0.5)];
    const result = getNodeType('translatePointsY').evaluate({ points: { type: 'points', value: points } }, {});
    const translated = result.points?.type === 'points' ? result.points.value : undefined;
    expect(translated).toEqual([new THREE.Vector2(0.1, 0.5)]);
  });
});
