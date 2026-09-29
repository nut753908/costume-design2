import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function evaluateGeometry(inputs: Record<string, number>): THREE.BufferGeometry {
  const result = getNodeType('torsoShape').evaluate(
    Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)])),
    {},
  );
  return result.geometry?.type === 'geometry' ? result.geometry.value : new THREE.BufferGeometry();
}

/** 高さ y 付近(±tolerance)の頂点の、X 方向・Z 方向の最大の広がり。 */
function extentAt(geometry: THREE.BufferGeometry, y: number, tolerance = 0.004): { x: number; z: number } {
  const position = geometry.getAttribute('position');
  let x = 0;
  let z = 0;
  for (let i = 0; i < position.count; i++) {
    if (Math.abs(position.getY(i) - y) < tolerance) {
      x = Math.max(x, Math.abs(position.getX(i)));
      z = Math.max(z, Math.abs(position.getZ(i)));
    }
  }
  return { x, z };
}

/** テンプレートの `xProfile` の、制御点 `r<k>`(`radius` に対する比)。 */
function xRatio(k: number): number {
  const data = getNodeType('torsoShape').createDefaultData() as { nodes: { id: string; data: Record<string, number> }[] };
  return data.nodes.find((n) => n.id === 'xProfile')!.data[`r${k}`];
}

describe('torsoShape', () => {
  const base = { radius: 0.15, length: 0.3 };
  const height = 0.3 + 2 * 0.15;

  it('原点(股)から length + 2 × radius の高さまで伸びる', () => {
    const geometry = evaluateGeometry(base);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.min.y).toBeCloseTo(0, 5);
    expect(box.max.y).toBeCloseTo(height, 5);
  });

  it('幅(X)は radius に比例し、前後(Z)はそれより薄い(楕円断面)', () => {
    const geometry = evaluateGeometry(base);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    // 最も広い制御点(r1)が幅の最大
    expect(box.max.x).toBeCloseTo(0.15 * xRatio(1), 2);
    expect(box.max.z).toBeLessThan(box.max.x * 0.8);
    expect(box.max.z).toBeGreaterThan(box.max.x * 0.5);
  });

  it('輪郭の制御点(高さを 8 等分した点)の高さでは、幅は radius × xProfile の r に一致する', () => {
    const geometry = evaluateGeometry(base);
    expect(extentAt(geometry, (2 / 8) * height).x).toBeCloseTo(0.15 * xRatio(2), 2);
    expect(extentAt(geometry, (4 / 8) * height).x).toBeCloseTo(0.15 * xRatio(4), 2);
  });

  it('両端は丸く閉じる(下端・上端の近くで半径が小さくなる)', () => {
    const geometry = evaluateGeometry(base);
    expect(extentAt(geometry, 0.004).x).toBeLessThan(0.15 * 0.5);
    expect(extentAt(geometry, height - 0.004).x).toBeLessThan(0.15 * 0.5);
  });

  it('radius を大きくすると、形が相似のまま横にも前後にも広がる', () => {
    const small = evaluateGeometry({ radius: 0.1, length: 0.2 });
    const large = evaluateGeometry({ radius: 0.2, length: 0.4 });
    small.computeBoundingBox();
    large.computeBoundingBox();
    expect(large.boundingBox!.max.x).toBeCloseTo(small.boundingBox!.max.x * 2, 2);
    expect(large.boundingBox!.max.z).toBeCloseTo(small.boundingBox!.max.z * 2, 2);
  });
});
