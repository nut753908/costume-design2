import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './translateX';

describe('translateX', () => {
  it('geometry を X方向にだけ平行移動する', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const result = getNodeType('translateX').evaluate(
      { geometry: { type: 'geometry', value: geometry }, x: { type: 'number', value: 2 } },
      {},
    );
    expect(result.geometry?.type).toBe('geometry');
    const translated = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    translated!.computeBoundingBox();
    expect(translated!.boundingBox!.min.x).toBeCloseTo(1.5);
    expect(translated!.boundingBox!.max.x).toBeCloseTo(2.5);
  });

  it('geometry が未接続なら何も返さない', () => {
    const result = getNodeType('translateX').evaluate({ x: { type: 'number', value: 2 } }, {});
    expect(result.geometry).toBeUndefined();
  });

  it('x が未接続なら0にフォールバックする', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const result = getNodeType('translateX').evaluate({ geometry: { type: 'geometry', value: geometry } }, {});
    const translated = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    translated!.computeBoundingBox();
    expect(translated!.boundingBox!.min.x).toBeCloseTo(-0.5);
  });
});
