import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './mergeGeometry';

describe('mergeGeometry', () => {
  it('2つの geometry を1つの BufferGeometry へ結合する', () => {
    const a = new THREE.BoxGeometry(0.1, 0.1, 0.1).translate(-0.2, 0, 0);
    const b = new THREE.BoxGeometry(0.1, 0.1, 0.1).translate(0.2, 0, 0);
    const result = getNodeType('mergeGeometry').evaluate(
      { geometryA: { type: 'geometry', value: a }, geometryB: { type: 'geometry', value: b } },
      {},
    );
    const merged = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expect(merged).toBeDefined();
    merged!.computeBoundingBox();
    expect(merged!.boundingBox!.min.x).toBeCloseTo(-0.25, 5);
    expect(merged!.boundingBox!.max.x).toBeCloseTo(0.25, 5);
  });

  it('geometryA が未接続なら何も返さない', () => {
    const b = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const result = getNodeType('mergeGeometry').evaluate({ geometryB: { type: 'geometry', value: b } }, {});
    expect(result.geometry).toBeUndefined();
  });

  it('geometryB が未接続なら何も返さない', () => {
    const a = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const result = getNodeType('mergeGeometry').evaluate({ geometryA: { type: 'geometry', value: a } }, {});
    expect(result.geometry).toBeUndefined();
  });
});
