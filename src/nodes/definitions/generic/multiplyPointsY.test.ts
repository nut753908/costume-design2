import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './multiplyPointsY';

describe('multiplyPointsY', () => {
  it('Y 同士を要素ごとに掛け、x は pointsA のものを引き継ぐ', () => {
    const a = [new THREE.Vector2(0, 2), new THREE.Vector2(1, 3)];
    const b = [new THREE.Vector2(9, 4), new THREE.Vector2(9, 0.5)];
    const result = getNodeType('multiplyPointsY').evaluate(
      { pointsA: { type: 'points', value: a }, pointsB: { type: 'points', value: b } },
      {},
    );
    expect(result.points?.type === 'points' ? result.points.value : undefined).toEqual([
      new THREE.Vector2(0, 8),
      new THREE.Vector2(1, 1.5),
    ]);
  });

  it('点の数は短い方に揃う', () => {
    const a = [new THREE.Vector2(0, 1), new THREE.Vector2(1, 1), new THREE.Vector2(2, 1)];
    const b = [new THREE.Vector2(0, 1)];
    const result = getNodeType('multiplyPointsY').evaluate(
      { pointsA: { type: 'points', value: a }, pointsB: { type: 'points', value: b } },
      {},
    );
    expect(result.points?.type === 'points' ? result.points.value.length : 0).toBe(1);
  });

  it('どちらかが未接続なら何も返さない', () => {
    const p = { type: 'points' as const, value: [new THREE.Vector2(0, 1)] };
    expect(getNodeType('multiplyPointsY').evaluate({ pointsA: p }, {}).points).toBeUndefined();
    expect(getNodeType('multiplyPointsY').evaluate({ pointsB: p }, {}).points).toBeUndefined();
  });
});
