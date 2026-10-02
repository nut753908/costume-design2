import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function boundingBoxOf(inputs: Record<string, number>): THREE.Box3 {
  const result = getNodeType('neckShape').evaluate(Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)])), {});
  const geometry = result.geometry?.type === 'geometry' ? result.geometry.value : new THREE.BufferGeometry();
  geometry.computeBoundingBox();
  return geometry.boundingBox!;
}

describe('neckShape', () => {
  const base = { radius: 0.05, length: 0.1 };

  it('中心が原点で、length の高さに伸びる', () => {
    const box = boundingBoxOf(base);
    expect(box.min.y).toBeCloseTo(-0.05, 5);
    expect(box.max.y).toBeCloseTo(0.05, 5);
  });

  it('幅と奥行きは radius に比例する', () => {
    const small = boundingBoxOf(base);
    const large = boundingBoxOf({ radius: 0.1, length: 0.1 });
    expect(large.max.x).toBeCloseTo(small.max.x * 2, 2);
    expect(large.max.z).toBeCloseTo(small.max.z * 2, 2);
    expect(large.min.z).toBeCloseTo(small.min.z * 2, 2);
  });

  it('前側(+Z)は後ろ側(-Z)とは別の輪郭で、上端であごの下へ向けて前側が広がる', () => {
    const geometry = (() => {
      const result = getNodeType('neckShape').evaluate({ radius: num(0.05), length: num(0.1) }, {});
      return result.geometry?.type === 'geometry' ? result.geometry.value : new THREE.BufferGeometry();
    })();
    const position = geometry.getAttribute('position');
    const frontAt = (y: number) => {
      let z = 0;
      for (let i = 0; i < position.count; i++) if (Math.abs(position.getY(i) - y) < 0.004) z = Math.max(z, position.getZ(i));
      return z;
    };
    // 下端側より上端側のほうが前へ出ている。
    expect(frontAt(0.03)).toBeGreaterThan(frontAt(-0.03));
  });
});
