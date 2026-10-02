import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function evaluateGeometry(type: string, inputs: Record<string, number>): THREE.BufferGeometry {
  const result = getNodeType(type).evaluate(Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)])), {});
  return result.geometry?.type === 'geometry' ? result.geometry.value : new THREE.BufferGeometry();
}

function boundingBoxOf(geometry: THREE.BufferGeometry): THREE.Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox!;
}

/** 高さ y 付近(±tolerance)の頂点の、X 方向の最大の広がり。 */
function widthAt(geometry: THREE.BufferGeometry, y: number, tolerance = 0.006): number {
  const position = geometry.getAttribute('position');
  let x = 0;
  for (let i = 0; i < position.count; i++) {
    if (Math.abs(position.getY(i) - y) < tolerance) x = Math.max(x, Math.abs(position.getX(i)));
  }
  return x;
}

describe.each(['armShaft', 'legShaft'])('%s', (type) => {
  const base = { radius: 0.1, length: 0.6 };
  const height = 0.6 + 2 * 0.1;

  it('中心が原点で、length + 2 × radius の高さに伸びる(付け根と先端の球の外側まで)', () => {
    const box = boundingBoxOf(evaluateGeometry(type, base));
    expect(box.min.y).toBeCloseTo(-height / 2, 5);
    expect(box.max.y).toBeCloseTo(height / 2, 5);
  });

  it('幅と奥行きは radius に比例する', () => {
    const small = boundingBoxOf(evaluateGeometry(type, base));
    const large = boundingBoxOf(evaluateGeometry(type, { radius: 0.2, length: 1.2 }));
    expect(large.max.x).toBeCloseTo(small.max.x * 2, 2);
    expect(large.max.z).toBeCloseTo(small.max.z * 2, 2);
    expect(large.min.z).toBeCloseTo(small.min.z * 2, 2);
  });

  it('両端は丸く閉じる(上端・下端の近くで半径が小さくなる)', () => {
    const geometry = evaluateGeometry(type, base);
    expect(widthAt(geometry, height / 2 - 0.004)).toBeLessThan(0.1 * 0.5);
    expect(widthAt(geometry, -height / 2 + 0.004)).toBeLessThan(0.1 * 0.5);
  });

  it('付け根(上端)の球の中心の高さでは、幅は radius と同程度になる', () => {
    // 上端の球の中心は 中心から length / 2 上(= 輪郭の `r7` の高さ)。
    const width = widthAt(evaluateGeometry(type, base), 0.3);
    expect(width).toBeGreaterThan(0.1 * 0.5);
    expect(width).toBeLessThan(0.1 * 1.5);
  });
});
