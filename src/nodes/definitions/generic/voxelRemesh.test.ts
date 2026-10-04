import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './voxelRemesh';

const num = (value: number) => ({ type: 'number' as const, value });

describe('voxelRemesh', () => {
  it('箱の中を作り直し、入力ジオメトリは変更しない', () => {
    const sphere = new THREE.SphereGeometry(0.3, 24, 16);
    const before = sphere.getAttribute('position').count;
    const result = getNodeType('voxelRemesh').evaluate(
      { geometry: { type: 'geometry', value: sphere }, centerY: num(0), below: num(0.2), above: num(0.2), halfWidth: num(0.2), voxelSize: num(0.03) },
      {},
    );
    const out = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expect(out).toBeDefined();
    expect(out!.getAttribute('position').count).toBeGreaterThan(before);
    expect(sphere.getAttribute('position').count).toBe(before);
  });

  it('geometry が未接続、または voxelSize が 0 以下なら何も出力しない', () => {
    expect(getNodeType('voxelRemesh').evaluate({}, {})).toEqual({});
    const sphere = new THREE.SphereGeometry(0.3, 8, 6);
    expect(getNodeType('voxelRemesh').evaluate({ geometry: { type: 'geometry', value: sphere }, voxelSize: num(0) }, {})).toEqual({});
  });
});
