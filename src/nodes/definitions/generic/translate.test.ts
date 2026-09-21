import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './translate';

function box() {
  return { type: 'geometry' as const, value: new THREE.BoxGeometry(1, 1, 1) };
}

describe('translate', () => {
  it('X/Y/Z の3軸方向へ平行移動する(入力ジオメトリは変更しない)', () => {
    const input = box();
    const result = getNodeType('translate').evaluate(
      { geometry: input, x: { type: 'number', value: 1 }, y: { type: 'number', value: 2 }, z: { type: 'number', value: 3 } },
      {},
    );
    const out = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    out!.computeBoundingBox();
    expect(out!.boundingBox!.min.toArray()).toEqual([0.5, 1.5, 2.5]);
    input.value.computeBoundingBox();
    expect(input.value.boundingBox!.min.toArray()).toEqual([-0.5, -0.5, -0.5]);
  });

  it('未接続の軸は 0 として扱う', () => {
    const result = getNodeType('translate').evaluate({ geometry: box(), y: { type: 'number', value: 2 } }, {});
    const out = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    out!.computeBoundingBox();
    expect(out!.boundingBox!.min.toArray()).toEqual([-0.5, 1.5, -0.5]);
  });

  it('geometry が未接続なら何も出力しない', () => {
    expect(getNodeType('translate').evaluate({ x: { type: 'number', value: 1 } }, {})).toEqual({});
  });
});
