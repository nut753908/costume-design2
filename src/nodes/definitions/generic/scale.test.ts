import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './scale';

function box() {
  return { type: 'geometry' as const, value: new THREE.BoxGeometry(1, 1, 1) };
}

describe('scale', () => {
  it('X/Y/Z の3軸方向へ非一様スケールする', () => {
    const result = getNodeType('scale').evaluate(
      { geometry: box(), x: { type: 'number', value: 2 }, y: { type: 'number', value: 3 }, z: { type: 'number', value: 4 } },
      {},
    );
    const scaled = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    scaled!.computeBoundingBox();
    expect(scaled!.boundingBox!.max.toArray()).toEqual([1, 1.5, 2]);
  });

  it('未接続の軸は1(スケールなし)として扱う', () => {
    const result = getNodeType('scale').evaluate({ geometry: box(), z: { type: 'number', value: 2 } }, {});
    const scaled = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    scaled!.computeBoundingBox();
    expect(scaled!.boundingBox!.max.toArray()).toEqual([0.5, 0.5, 1]);
  });

  it('geometry が未接続なら何も出力しない', () => {
    expect(getNodeType('scale').evaluate({ z: { type: 'number', value: 2 } }, {})).toEqual({});
  });
});
