import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './taperY';

const num = (value: number) => ({ type: 'number' as const, value });

function cylinder() {
  return { type: 'geometry' as const, value: new THREE.CylinderGeometry(1, 1, 2, 16, 8) };
}

/** 高さ y 付近の頂点の、Y軸からの最大距離。 */
function radiusAt(geometry: THREE.BufferGeometry, y: number): number {
  const position = geometry.getAttribute('position');
  let max = 0;
  for (let i = 0; i < position.count; i++) {
    if (Math.abs(position.getY(i) - y) < 1e-6) max = Math.max(max, Math.hypot(position.getX(i), position.getZ(i)));
  }
  return max;
}

function run(inputs: Record<string, ReturnType<typeof num> | ReturnType<typeof cylinder>>) {
  const result = getNodeType('taperY').evaluate(inputs, {});
  return result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
}

describe('taperY', () => {
  it('下端は bottomScale 倍に絞られ、startRatio の高さから上は元の半径のまま', () => {
    const geometry = run({ geometry: cylinder(), bottomScale: num(0.4), startRatio: num(0.5) })!;
    expect(radiusAt(geometry, -1)).toBeCloseTo(0.4, 5);
    expect(radiusAt(geometry, 0)).toBeCloseTo(1, 5);
    expect(radiusAt(geometry, 1)).toBeCloseTo(1, 5);
    // 途中(下端と startRatio の中間)は両者の間に収まる。
    const mid = radiusAt(geometry, -0.5);
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(1);
  });

  it('高さ(Y)は変えない', () => {
    const geometry = run({ geometry: cylinder(), bottomScale: num(0.4) })!;
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.y).toBeCloseTo(-1, 5);
    expect(geometry.boundingBox!.max.y).toBeCloseTo(1, 5);
  });

  it('bottomScale が未接続(1)なら形を変えず、入力のジオメトリも書き換えない', () => {
    const input = cylinder();
    const before = Array.from(input.value.getAttribute('position').array);
    const geometry = run({ geometry: input })!;
    expect(Array.from(geometry.getAttribute('position').array)).toEqual(before);
    const tapered = run({ geometry: input, bottomScale: num(0.5) })!;
    expect(tapered).not.toBe(input.value);
    expect(Array.from(input.value.getAttribute('position').array)).toEqual(before);
  });

  it('geometry が未接続なら何も出力しない', () => {
    expect(getNodeType('taperY').evaluate({ bottomScale: num(0.5) }, {})).toEqual({});
  });
});
