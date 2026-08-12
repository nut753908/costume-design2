import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildSleeveGeometry, sleeveTubeFrame, SLEEVE_ANGLES } from './sleeve';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = { attachRadius: 0.3, sleeveRadius: 0.085, segments: 12 } as const;

// sleeve のチューブは Y軸ではなく、肩ごとに斜めに伸びるローカルな軸を持つ。build 順
// (SLEEVE_ANGLES の順)に position/index が連結されるため、index 配列の前半/後半でどちらの
// 肩の originAngle を使うかを判定し、sleeveTubeFrame と同じ式で軸上の最近点を求める。
function sleeveAxisPoint(centroid: THREE.Vector3, i: number, totalIndexCount: number): THREE.Vector3 {
  const originAngle = i < totalIndexCount / 2 ? SLEEVE_ANGLES[0] : SLEEVE_ANGLES[1];
  const { origin, axis } = sleeveTubeFrame(originAngle, BASE.attachRadius);
  const t = centroid.clone().sub(origin).dot(axis);
  return origin.clone().add(axis.clone().multiplyScalar(t));
}

describe('buildSleeveGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildSleeveGeometry({ ...BASE, sleeveLength: 0.22 });
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    expect(index!.count).toBeGreaterThan(0);

    const pos = geometry.getAttribute('position').array as Float32Array;
    expect(pos.length).toBeGreaterThan(0);
    for (let i = 0; i < pos.length; i++) {
      expect(Number.isNaN(pos[i])).toBe(false);
    }
  });

  it('X方向に鏡像となる2本のチューブ(右+左)を生成する', () => {
    const geometry = buildSleeveGeometry({ ...BASE, sleeveLength: 0.22 });
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    // 中心軸に対して対称: 両側でおおよそ同じ広がりを持つ。
    expect(box.max.x).toBeGreaterThan(0);
    expect(box.min.x).toBeLessThan(0);
    expect(box.max.x).toBeCloseTo(-box.min.x, 1);
  });

  it('sleeveLength が長くなるほど外側に伸びる', () => {
    const short = buildSleeveGeometry({ ...BASE, sleeveLength: 0.05 });
    const long = buildSleeveGeometry({ ...BASE, sleeveLength: 0.4 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.max.x).toBeGreaterThan(short.boundingBox!.max.x);
  });

  it('sleeveLength が長くなるほど(垂れ下がって)低い位置になる', () => {
    const short = buildSleeveGeometry({ ...BASE, sleeveLength: 0.05 });
    const long = buildSleeveGeometry({ ...BASE, sleeveLength: 0.4 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('指定した segments に対して期待通りの頂点数になる', () => {
    const geometry = buildSleeveGeometry({ ...BASE, sleeveLength: 0.22 });
    const vertexCount = geometry.getAttribute('position').count;
    // 2チューブ * 2行 * (segments + 1) 列
    expect(vertexCount).toBe(2 * 2 * (BASE.segments + 1));
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    expectOutwardWinding(buildSleeveGeometry({ ...BASE, sleeveLength: 0.22 }), sleeveAxisPoint);
  });
});
