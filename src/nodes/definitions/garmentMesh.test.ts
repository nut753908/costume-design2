import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../registry';
import './garmentMesh';

describe('garmentMesh', () => {
  it('geometry/material が接続されていればそのまま出力する', () => {
    const geometry = { type: 'geometry' as const, value: new THREE.BufferGeometry() };
    const material = { type: 'material' as const, value: new THREE.MeshToonMaterial() };
    const result = getNodeType('garmentMesh').evaluate({ geometry, material }, {});
    expect(result.geometry).toBe(geometry);
    expect(result.material).toBe(material);
  });

  it('geometry が未接続なら出力に含めない(フォールバックは持たない)', () => {
    const material = { type: 'material' as const, value: new THREE.MeshToonMaterial() };
    const result = getNodeType('garmentMesh').evaluate({ material }, {});
    expect(result.geometry).toBeUndefined();
  });

  it('material が未接続なら出力に含めない(フォールバックは持たない)', () => {
    const geometry = { type: 'geometry' as const, value: new THREE.BufferGeometry() };
    const result = getNodeType('garmentMesh').evaluate({ geometry }, {});
    expect(result.material).toBeUndefined();
  });

  it('createDefaultData は空オブジェクトを返す(config を一切持たない)', () => {
    expect(getNodeType('garmentMesh').createDefaultData()).toEqual({});
  });
});
