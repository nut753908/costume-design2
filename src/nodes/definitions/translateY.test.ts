import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './translateY';

describe('translateY', () => {
  it('geometry を Y方向にだけ平行移動する', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const result = getNodeType('translateY').evaluate(
      { geometry: { type: 'geometry', value: geometry }, y: { type: 'number', value: 2 } },
      {},
    );
    expect(result.geometry?.type).toBe('geometry');
    const translated = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    translated!.computeBoundingBox();
    expect(translated!.boundingBox!.min.y).toBeCloseTo(1.5);
    expect(translated!.boundingBox!.max.y).toBeCloseTo(2.5);
  });

  it('geometry が未接続なら何も返さない', () => {
    const result = getNodeType('translateY').evaluate({ y: { type: 'number', value: 2 } }, {});
    expect(result.geometry).toBeUndefined();
  });

  it('y が未接続なら0にフォールバックする', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const result = getNodeType('translateY').evaluate({ geometry: { type: 'geometry', value: geometry } }, {});
    const translated = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    translated!.computeBoundingBox();
    expect(translated!.boundingBox!.min.y).toBeCloseTo(-0.5);
  });
});
