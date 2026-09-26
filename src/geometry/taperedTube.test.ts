import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildTaperedTube, tubeFrame, type TaperedTubeParams } from './taperedTube';
import { expectOutwardWinding } from './windingTestHelpers';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const ELLIPSE: TaperedTubeParams = {
  start: V(0, 0, 0),
  end: V(0, -1, 0),
  startWidth: 0.4,
  startThickness: 0.2,
  endWidth: 0.2,
  endThickness: 0.1,
  shape: 'ellipse',
  segments: 12,
};
const RECTANGLE: TaperedTubeParams = { ...ELLIPSE, shape: 'rectangle' };

function bounds(geometry: THREE.BufferGeometry): THREE.Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox!;
}

// 軸(start→end の直線)上で、重心に最も近い点。
function axisPointOf(start: THREE.Vector3, end: THREE.Vector3) {
  const axis = end.clone().sub(start).normalize();
  return (centroid: THREE.Vector3) => start.clone().add(axis.clone().multiplyScalar(centroid.clone().sub(start).dot(axis)));
}

describe('buildTaperedTube', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    for (const params of [ELLIPSE, RECTANGLE]) {
      const geometry = buildTaperedTube(params);
      expect(geometry.getIndex()!.count % 3).toBe(0);
      expect(geometry.getIndex()!.count).toBeGreaterThan(0);
      const pos = geometry.getAttribute('position').array as Float32Array;
      for (let i = 0; i < pos.length; i++) expect(Number.isNaN(pos[i])).toBe(false);
    }
  });

  it('頂点数は 2行 × 断面の点数(楕円は segments+1、矩形は閉じた4隅で5)', () => {
    expect(buildTaperedTube(ELLIPSE).getAttribute('position').count).toBe(2 * 13);
    expect(buildTaperedTube(RECTANGLE).getAttribute('position').count).toBe(2 * 5);
  });

  it('両端は start/end の位置に置かれる', () => {
    const box = bounds(buildTaperedTube(ELLIPSE));
    expect(box.max.y).toBeCloseTo(0, 6);
    expect(box.min.y).toBeCloseTo(-1, 6);
  });

  it('矩形は幅×厚みにちょうど収まり、テーパーで end 側が細くなる(軸が -Y のとき幅は X、厚みは Z)', () => {
    const geometry = buildTaperedTube(RECTANGLE);
    const box = bounds(geometry);
    expect(box.max.x).toBeCloseTo(0.2, 6);
    expect(box.min.x).toBeCloseTo(-0.2, 6);
    expect(box.max.z).toBeCloseTo(0.1, 6);
    const pos = geometry.getAttribute('position').array as Float32Array;
    const endRow = 5 * 3;
    const endXs = [0, 1, 2, 3].map((i) => Math.abs(pos[endRow + i * 3]));
    expect(Math.max(...endXs)).toBeCloseTo(0.1, 6);
  });

  it('楕円は幅・厚みを直径とする', () => {
    const box = bounds(buildTaperedTube({ ...ELLIPSE, endWidth: 0.4, endThickness: 0.2 }));
    expect(box.max.x).toBeCloseTo(0.2, 6);
    expect(box.max.z).toBeCloseTo(0.1, 6);
  });

  it('斜めの軸でも start/end を結ぶ', () => {
    const start = V(0.2, 0, 0);
    const end = V(0.5, -0.3, 0);
    const box = bounds(buildTaperedTube({ ...ELLIPSE, start, end, startWidth: 0.1, startThickness: 0.1, endWidth: 0.1, endThickness: 0.1 }));
    expect(box.max.x).toBeGreaterThanOrEqual(0.5);
    expect(box.min.y).toBeLessThanOrEqual(-0.3);
  });

  it('全面が外向きの巻き順になっている(手前の面がカリングで消えるのを防ぐ)', () => {
    for (const params of [ELLIPSE, RECTANGLE]) {
      expectOutwardWinding(buildTaperedTube(params), axisPointOf(params.start, params.end));
    }
    const slanted = { ...ELLIPSE, start: V(0.2, 0, 0), end: V(0.5, -0.3, 0), endWidth: 0.2, endThickness: 0.2 };
    expectOutwardWinding(buildTaperedTube(slanted), axisPointOf(slanted.start, slanted.end));
    const leftSlanted = { ...slanted, start: V(-0.2, 0, 0), end: V(-0.5, -0.3, 0) };
    expectOutwardWinding(buildTaperedTube(leftSlanted), axisPointOf(leftSlanted.start, leftSlanted.end));
  });
});

describe('tubeFrame', () => {
  it('軸が Y と平行なら tangent は +X、binormal は +Z(軸が -Y のとき)', () => {
    const { tangent, binormal } = tubeFrame(V(0, 0, 0), V(0, -1, 0));
    expect(tangent.toArray()).toEqual([1, 0, 0]);
    expect(binormal.x).toBeCloseTo(0, 6);
    expect(binormal.z).toBeCloseTo(1, 6);
  });

  it('それ以外では tangent は水平で、3軸は互いに直交する', () => {
    const { axis, tangent, binormal } = tubeFrame(V(0, 0, 0), V(0.5, -0.3, 0.2));
    expect(tangent.y).toBeCloseTo(0, 6);
    expect(axis.dot(tangent)).toBeCloseTo(0, 6);
    expect(axis.dot(binormal)).toBeCloseTo(0, 6);
    expect(tangent.dot(binormal)).toBeCloseTo(0, 6);
  });
});
