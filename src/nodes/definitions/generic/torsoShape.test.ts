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

/** テンプレートの `xProfile`(33 点)の、制御点 `r<k>`(高さを 32 等分した位置、`radius` に対する比)。 */
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
    // 首の輪は前へ傾けてあり、輪の後ろ側の縁が極より少し(輪の半径 × sin 傾き)高くなる
    expect(box.max.y).toBeGreaterThanOrEqual(height - 1e-5);
    expect(box.max.y).toBeLessThan(height + 0.02);
  });

  it('幅(X)は radius に比例し、前後(Z)はそれより薄い(楕円断面)', () => {
    const geometry = evaluateGeometry(base);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    // 最も広い制御点の値の付近(スプラインの膨らみで少しはみ出す)が幅の最大
    const widest = Math.max(...Array.from({ length: 31 }, (_, i) => xRatio(i + 1)));
    expect(box.max.x).toBeGreaterThan(0.15 * widest * 0.98);
    expect(box.max.x).toBeLessThan(0.15 * widest * 1.06);
    expect(box.max.z).toBeLessThan(box.max.x * 0.8);
    expect(box.max.z).toBeGreaterThan(box.max.x * 0.5);
  });

  it('輪郭の制御点(高さを 32 等分した点)の近くの輪では、幅は radius × xProfile の r に近い', () => {
    // 輪は等間隔ではなく ringSpacing の曲線で置かれるので、制御点にいちばん近い輪の幅で確かめる
    const geometry = evaluateGeometry(base);
    const position = geometry.getAttribute('position');
    const widthNear = (y: number) => {
      let nearest = Infinity;
      for (let i = 0; i < position.count; i++) if (Math.abs(position.getY(i) - y) < Math.abs(nearest - y)) nearest = position.getY(i);
      let x = 0;
      for (let i = 0; i < position.count; i++) if (Math.abs(position.getY(i) - nearest) < 1e-6) x = Math.max(x, Math.abs(position.getX(i)));
      return x;
    };
    expect(widthNear((8 / 32) * height)).toBeCloseTo(0.15 * xRatio(8), 1);
    expect(widthNear((16 / 32) * height)).toBeCloseTo(0.15 * xRatio(16), 1);
  });

  it('extra だけ上端が伸び(首の延長)、先端は細く(首の太さ)なって丸く閉じる', () => {
    const geometry = evaluateGeometry({ ...base, extra: 0.1 });
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.y).toBeGreaterThanOrEqual(height + 0.1 - 1e-5);
    expect(geometry.boundingBox!.max.y).toBeLessThan(height + 0.1 + 0.02);
    // 首のあたり(延長の中ほど)の幅は、胴体の最大幅よりずっと細い
    expect(extentAt(geometry, height + 0.04, 0.006).x).toBeLessThan(0.15 * 0.6);
    // 先端の近くで半径が小さくなる
    expect(extentAt(geometry, height + 0.1 - 0.004).x).toBeLessThan(0.15 * 0.4);
  });

  it('両端は丸く閉じる(下端・上端の近くで半径が小さくなる)', () => {
    const geometry = evaluateGeometry(base);
    expect(extentAt(geometry, 0.004).x).toBeLessThan(0.15 * 0.8);
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
