import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function boundingBoxOf(inputs: Record<string, number>): THREE.Box3 {
  const result = getNodeType('footShape').evaluate(Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)])), {});
  const geometry = result.geometry?.type === 'geometry' ? result.geometry.value : new THREE.BufferGeometry();
  geometry.computeBoundingBox();
  return geometry.boundingBox!;
}

describe('footShape', () => {
  const base = { radius: 0.07, length: 0.18 };

  it('かかとが原点で、つま先(+Z)へ length だけ伸びる', () => {
    const box = boundingBoxOf(base);
    expect(box.min.z).toBeCloseTo(0, 3);
    expect(box.max.z).toBeCloseTo(0.18, 3);
  });

  it('幅と高さは radius に比例し、長さ(Z)は length だけで決まる', () => {
    const small = boundingBoxOf(base);
    const wide = boundingBoxOf({ radius: 0.14, length: 0.18 });
    expect(wide.max.x).toBeCloseTo(small.max.x * 2, 2);
    expect(wide.max.y).toBeCloseTo(small.max.y * 2, 2);
    expect(wide.min.y).toBeCloseTo(small.min.y * 2, 2);
    expect(wide.max.z).toBeCloseTo(small.max.z, 3);
  });

  it('足裏側(-Y)にも甲側(+Y)にも広がり、左右(X)は対称', () => {
    const box = boundingBoxOf(base);
    expect(box.min.y).toBeLessThan(-0.07 * 0.1);
    expect(box.max.y).toBeGreaterThan(0.07 * 0.1);
    expect(box.max.x).toBeCloseTo(-box.min.x, 5);
  });
});
