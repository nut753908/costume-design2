import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { expectOutwardWinding } from '../../../geometry/windingTestHelpers';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });
const ATTACH = 0.3;

function sleeves(sleeveLength: number, attachRadius = ATTACH, sleeveRadius = 0.085): THREE.BufferGeometry {
  const result = getNodeType('sleevePair').evaluate(
    { attachRadius: num(attachRadius), sleeveRadius: num(sleeveRadius), sleeveLength: num(sleeveLength) },
    {},
  );
  if (result.geometry?.type !== 'geometry') throw new Error('geometry が出力されていない');
  return result.geometry.value;
}

const box = (g: THREE.BufferGeometry) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};

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

  it('袖の付け根は attachRadius × 0.75(胴体の壁の内側)から、水平から36°下へ sleeveLength だけ伸びる', () => {
    const length = 0.22;
    const b = box(sleeves(length, ATTACH, 0.085));
    const startX = ATTACH * 0.75;
    const endX = startX + length * Math.cos(Math.PI / 5);
    // 終端側の断面(直径 2×0.085×0.85)は軸に垂直で、X方向には radius × sin(droop) だけ広がる。
    expect(b.max.x).toBeCloseTo(endX + 0.085 * 0.85 * Math.sin(Math.PI / 5), 5);
    expect(b.min.y).toBeLessThan(-length * Math.sin(Math.PI / 5) + 1e-6);
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
      const start = new THREE.Vector3(sign * ATTACH * 0.75, 0, 0);
      const axis = new THREE.Vector3(sign * Math.cos(Math.PI / 5), -Math.sin(Math.PI / 5), 0);
      return { start, axis };
    };
    expectOutwardWinding(sleeves(length), (centroid, i, total) => {
      const { start, axis } = half(i < total / 2 ? -1 : 1);
      return start.clone().add(axis.clone().multiplyScalar(centroid.clone().sub(start).dot(axis)));
    });
  });
});
