import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { expectOutwardWinding } from '../../../geometry/windingTestHelpers';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });
const SPACING = 0.15;

function sleeves(sleeveLength: number, spacing = SPACING, sleeveRadius = 0.085): THREE.BufferGeometry {
  const result = getNodeType('sleevePair').evaluate(
    { spacing: num(spacing), sleeveRadius: num(sleeveRadius), sleeveLength: num(sleeveLength) },
    {},
  );
  if (result.geometry?.type !== 'geometry') throw new Error('geometry が出力されていない');
  return result.geometry.value;
}

const box = (g: THREE.BufferGeometry) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};

const DROOP = (88 * Math.PI) / 180;

describe('sleevePair', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = sleeves(0.22);
    expect(geometry.getIndex()!.count % 3).toBe(0);
    expect(geometry.getIndex()!.count).toBeGreaterThan(0);
    const pos = geometry.getAttribute('position').array as Float32Array;
    for (let i = 0; i < pos.length; i++) expect(Number.isNaN(pos[i])).toBe(false);
  });

  it('X方向に鏡像となる2本のチューブ(右+左)を生成する', () => {
    const b = box(sleeves(0.22));
    expect(b.max.x).toBeGreaterThan(0);
    expect(b.max.x).toBeCloseTo(-b.min.x, 6);
  });

  it('頂点数は 2チューブ × 2行 × (segments 12 + 1)', () => {
    expect(sleeves(0.22).getAttribute('position').count).toBe(2 * 2 * 13);
  });

  it('袖の付け根は ±spacing(腕の中心)から、水平から88°下へ sleeveLength だけ伸びる', () => {
    const length = 0.22;
    const b = box(sleeves(length, SPACING, 0.085));
    const startX = SPACING;
    const endX = startX + length * Math.cos(DROOP);
    // 各断面は軸に垂直で、X方向には radius × sin(droop) だけ広がる。ほぼ真下へ伸びるので、
    // 最大Xは太い付け根側と先細りの終端側の広い方で決まる。
    const expected = Math.max(startX + 0.085 * Math.sin(DROOP), endX + 0.085 * 0.85 * Math.sin(DROOP));
    expect(b.max.x).toBeCloseTo(expected, 5);
    expect(b.min.y).toBeLessThan(-length * Math.sin(DROOP) + 1e-6);
  });

  it('sleeveLength が長くなるほど外側へ伸び、(垂れ下がって)低い位置になる', () => {
    const short = box(sleeves(0.05));
    const long = box(sleeves(0.4));
    expect(long.max.x).toBeGreaterThan(short.max.x);
    expect(long.min.y).toBeLessThan(short.min.y);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    const length = 0.22;
    const half = (sign: 1 | -1) => {
      const start = new THREE.Vector3(sign * SPACING, 0, 0);
      const axis = new THREE.Vector3(sign * Math.cos(DROOP), -Math.sin(DROOP), 0);
      return { start, axis };
    };
    expectOutwardWinding(sleeves(length), (centroid, i, total) => {
      const { start, axis } = half(i < total / 2 ? -1 : 1);
      return start.clone().add(axis.clone().multiplyScalar(centroid.clone().sub(start).dot(axis)));
    });
  });
});
