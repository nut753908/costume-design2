import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function center(inputs: Record<string, ReturnType<typeof num>>) {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const result = getNodeType('translate').evaluate({ geometry: { type: 'geometry', value: box }, ...inputs }, {});
  const geometry = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
  geometry!.computeBoundingBox();
  return geometry!.boundingBox!.getCenter(new THREE.Vector3());
}

describe('translate', () => {
  it('X/Y/Z の3軸方向へ平行移動する', () => {
    const c = center({ x: num(1), y: num(2), z: num(3) });
    expect([c.x, c.y, c.z]).toEqual([1, 2, 3]);
  });

  it('未接続の軸は動かさない', () => {
    const c = center({ y: num(2) });
    expect([c.x, c.y, c.z]).toEqual([0, 2, 0]);
  });

  it('geometry が未接続なら何も返さない', () => {
    expect(getNodeType('translate').evaluate({ x: num(1) }, {}).geometry).toBeUndefined();
  });
});
