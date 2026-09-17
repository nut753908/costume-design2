import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './scaleZ';

describe('scaleZ', () => {
  it('geometry を Z方向にだけ非一様スケールする', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const result = getNodeType('scaleZ').evaluate(
      { geometry: { type: 'geometry', value: geometry }, z: { type: 'number', value: 2 } },
      {},
    );
    const scaled = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    scaled!.computeBoundingBox();
    expect(scaled!.boundingBox!.min.z).toBeCloseTo(-1);
    expect(scaled!.boundingBox!.max.z).toBeCloseTo(1);
    // X/Y はスケールされない。
    expect(scaled!.boundingBox!.max.x).toBeCloseTo(0.5);
    expect(scaled!.boundingBox!.max.y).toBeCloseTo(0.5);
  });

  it('geometry が未接続なら何も返さない', () => {
    const result = getNodeType('scaleZ').evaluate({ z: { type: 'number', value: 2 } }, {});
    expect(result.geometry).toBeUndefined();
  });

  it('z が未接続なら1(スケールなし)にフォールバックする', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const result = getNodeType('scaleZ').evaluate({ geometry: { type: 'geometry', value: geometry } }, {});
    const scaled = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    scaled!.computeBoundingBox();
    expect(scaled!.boundingBox!.max.z).toBeCloseTo(0.5);
  });
});
