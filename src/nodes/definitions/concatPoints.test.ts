import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './concatPoints';

describe('concatPoints', () => {
  it('2つの points を順番通りに連結する', () => {
    const a = [new THREE.Vector2(0, 0), new THREE.Vector2(1, 1)];
    const b = [new THREE.Vector2(2, 2)];
    const result = getNodeType('concatPoints').evaluate(
      { pointsA: { type: 'points', value: a }, pointsB: { type: 'points', value: b } },
      {},
    );
    const concatenated = result.points?.type === 'points' ? result.points.value : undefined;
    expect(concatenated).toEqual([new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(2, 2)]);
  });

  it('pointsA が未接続なら何も返さない', () => {
    const b = [new THREE.Vector2(2, 2)];
    const result = getNodeType('concatPoints').evaluate({ pointsB: { type: 'points', value: b } }, {});
    expect(result.points).toBeUndefined();
  });

  it('pointsB が未接続なら何も返さない', () => {
    const a = [new THREE.Vector2(0, 0)];
    const result = getNodeType('concatPoints').evaluate({ pointsA: { type: 'points', value: a } }, {});
    expect(result.points).toBeUndefined();
  });
});
