import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './rotate';

const num = (value: number) => ({ type: 'number' as const, value });

function bar() {
  // 下へ 1 だけ伸びる細い棒(先端は (0, -1, 0))。
  const geometry = new THREE.BoxGeometry(0.02, 1, 0.02);
  geometry.translate(0, -0.5, 0);
  return { type: 'geometry' as const, value: geometry };
}

describe('rotate', () => {
  it('Z を正の角度で回すと、下へ伸びた先端が +X 側へ振れる', () => {
    const result = getNodeType('rotate').evaluate({ geometry: bar(), z: num(90) }, {});
    const rotated = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    rotated!.computeBoundingBox();
    expect(rotated!.boundingBox!.max.x).toBeCloseTo(1, 2);
    expect(rotated!.boundingBox!.min.y).toBeGreaterThan(-0.02);
  });

  it('未接続の軸は回さず、入力のジオメトリを書き換えない', () => {
    const input = bar();
    const before = input.value.getAttribute('position').array.slice();
    const result = getNodeType('rotate').evaluate({ geometry: input }, {});
    const output = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expect(Array.from(output!.getAttribute('position').array)).toEqual(Array.from(before));
    expect(output).not.toBe(input.value);
    expect(Array.from(input.value.getAttribute('position').array)).toEqual(Array.from(before));
  });

  it('geometry が未接続なら何も出力しない', () => {
    expect(getNodeType('rotate').evaluate({ z: num(30) }, {})).toEqual({});
  });
});
