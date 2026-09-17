import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './slicePoints';

const POINTS = [new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(2, 2)];

describe('slicePoints', () => {
  it('末尾から dropEnd 個ぶんの点を取り除く', () => {
    const result = getNodeType('slicePoints').evaluate(
      { points: { type: 'points', value: POINTS }, dropEnd: { type: 'number', value: 1 } },
      {},
    );
    const sliced = result.points?.type === 'points' ? result.points.value : undefined;
    expect(sliced).toEqual([new THREE.Vector2(0, 0), new THREE.Vector2(1, 1)]);
  });

  it('dropEnd が未接続なら0にフォールバックし、そのまま返す', () => {
    const result = getNodeType('slicePoints').evaluate({ points: { type: 'points', value: POINTS } }, {});
    const sliced = result.points?.type === 'points' ? result.points.value : undefined;
    expect(sliced).toEqual(POINTS);
  });

  it('points が未接続なら何も返さない', () => {
    const result = getNodeType('slicePoints').evaluate({ dropEnd: { type: 'number', value: 1 } }, {});
    expect(result.points).toBeUndefined();
  });
});
