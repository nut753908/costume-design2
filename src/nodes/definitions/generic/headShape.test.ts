import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function evaluateGeometry(inputs: Record<string, number>): THREE.BufferGeometry {
  const result = getNodeType('headShape').evaluate(
    Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)])),
    {},
  );
  return result.geometry?.type === 'geometry' ? result.geometry.value : new THREE.BufferGeometry();
}

function boundingBoxOf(geometry: THREE.BufferGeometry): THREE.Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox!;
}

describe('headShape', () => {
  it('原点(あご)から radius × 2 の高さまで伸び(下面は dropProfile で原点より少し下がる)、heightRatio で縦に伸縮する', () => {
    const box = boundingBoxOf(evaluateGeometry({ radius: 0.3 }));
    expect(box.min.y).toBeLessThan(0);
    expect(box.min.y).toBeGreaterThan(-0.3 * 0.1);
    expect(box.max.y).toBeCloseTo(0.6, 5);
    expect(boundingBoxOf(evaluateGeometry({ radius: 0.3, heightRatio: 1.2 })).max.y).toBeCloseTo(0.72, 5);
  });

  it('幅・奥行きは radius に比例し、およそ球の大きさに収まる', () => {
    const box = boundingBoxOf(evaluateGeometry({ radius: 0.3 }));
    expect(box.max.x).toBeGreaterThan(0.3 * 0.8);
    expect(box.max.x).toBeLessThan(0.3 * 1.05);
    expect(box.max.z).toBeGreaterThan(0.3 * 0.8);
    const double = boundingBoxOf(evaluateGeometry({ radius: 0.6 }));
    expect(double.max.x).toBeCloseTo(box.max.x * 2, 2);
  });

  it('後ろ側のあご(下端)付近は前側より引き込まれ、あごが前に出た形になる', () => {
    const geometry = evaluateGeometry({ radius: 0.3 });
    const position = geometry.getAttribute('position');
    let front = 0;
    let back = 0;
    for (let i = 0; i < position.count; i++) {
      if (Math.abs(position.getY(i) - 0.075) < 0.01) {
        front = Math.max(front, position.getZ(i));
        back = Math.max(back, -position.getZ(i));
      }
    }
    expect(front).toBeGreaterThan(back);
  });
});
