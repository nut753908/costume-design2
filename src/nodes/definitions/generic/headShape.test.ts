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
  it('原点(あご)から radius × 2 の高さまで伸び、heightRatio で縦に伸縮する', () => {
    const box = boundingBoxOf(evaluateGeometry({ radius: 0.3 }));
    expect(box.min.y).toBeCloseTo(0, 5);
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

  it('輪郭は凸で、あごから最も張った高さまで広がり続け、その後は頭頂へ狭まり続ける(へこみがない)', () => {
    // へこみがあるとトゥーンの帯が島状のまだらに割れるので、各高さの前後・左右の広がりが単峰であることを確かめる。
    const geometry = evaluateGeometry({ radius: 0.3 });
    const position = geometry.getAttribute('position');
    const rows = new Map<string, { x: number; front: number; back: number }>();
    for (let i = 0; i < position.count; i++) {
      const key = position.getY(i).toFixed(4);
      const row = rows.get(key) ?? { x: 0, front: 0, back: 0 };
      row.x = Math.max(row.x, Math.abs(position.getX(i)));
      row.front = Math.max(row.front, position.getZ(i));
      row.back = Math.max(row.back, -position.getZ(i));
      rows.set(key, row);
    }
    const ordered = [...rows.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map(([, row]) => row);
    for (const key of ['x', 'front', 'back'] as const) {
      const widths = ordered.map((row) => row[key]);
      const peak = widths.indexOf(Math.max(...widths));
      for (let i = 1; i <= peak; i++) expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1] - 1e-4);
      for (let i = peak + 1; i < widths.length; i++) expect(widths[i]).toBeLessThanOrEqual(widths[i - 1] + 1e-4);
    }
  });
});
