import { describe, expect, it } from 'vitest';
import { buildBoxGeometry, buildCapsuleGeometry, buildCylinderGeometry, buildSphereGeometry, buildTorusGeometry } from './primitives';

function positions(geometry: ReturnType<typeof buildCapsuleGeometry>): Float32Array {
  return geometry.getAttribute('position').array as Float32Array;
}

describe('buildCapsuleGeometry', () => {
  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildCapsuleGeometry({ radius: 0.26, length: 0.55, capSegments: 4, radialSegments: 16 });
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    const pos = positions(geometry);
    for (let i = 0; i < pos.length; i++) expect(Number.isNaN(pos[i])).toBe(false);
  });

  it('radius が大きくなるほど全体が外側に広がる', () => {
    const narrow = buildCapsuleGeometry({ radius: 0.2, length: 0.55, capSegments: 4, radialSegments: 16 });
    const wide = buildCapsuleGeometry({ radius: 0.4, length: 0.55, capSegments: 4, radialSegments: 16 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('length が長くなるほど縦方向に伸びる', () => {
    const short = buildCapsuleGeometry({ radius: 0.26, length: 0.3, capSegments: 4, radialSegments: 16 });
    const long = buildCapsuleGeometry({ radius: 0.26, length: 0.9, capSegments: 4, radialSegments: 16 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.max.y - long.boundingBox!.min.y).toBeGreaterThan(
      short.boundingBox!.max.y - short.boundingBox!.min.y,
    );
  });
});

describe('buildSphereGeometry', () => {
  it('radius が大きくなるほど全体が広がる', () => {
    const small = buildSphereGeometry({ radius: 0.1, widthSegments: 20, heightSegments: 16 });
    const large = buildSphereGeometry({ radius: 0.3, widthSegments: 20, heightSegments: 16 });
    small.computeBoundingBox();
    large.computeBoundingBox();
    expect(large.boundingBox!.max.x).toBeGreaterThan(small.boundingBox!.max.x);
  });
});

describe('buildCylinderGeometry', () => {
  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildCylinderGeometry({ radiusTop: 0.1, radiusBottom: 0.085, height: 0.6, radialSegments: 12 });
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    const pos = positions(geometry);
    for (let i = 0; i < pos.length; i++) expect(Number.isNaN(pos[i])).toBe(false);
  });

  it('radiusTop/radiusBottom で上下の太さが独立してテーパーする(下端リングの半径だけが変わる)', () => {
    // CylinderGeometry は Y軸沿いで、下端(y=-height/2)のリング半径は radiusBottom のみで決まる。
    // 全体の bounding box は radiusTop(0.1のまま不変)に支配されるため差が出ず検証にならないので、
    // 下端付近の頂点だけを抽出して半径を比較する。
    function bottomRingRadius(geometry: ReturnType<typeof buildCylinderGeometry>): number {
      geometry.computeBoundingBox();
      const minY = geometry.boundingBox!.min.y;
      const pos = positions(geometry);
      let maxRadius = 0;
      for (let i = 0; i < pos.length; i += 3) {
        const [x, y, z] = [pos[i], pos[i + 1], pos[i + 2]];
        if (Math.abs(y - minY) < 1e-6) maxRadius = Math.max(maxRadius, Math.hypot(x, z));
      }
      return maxRadius;
    }
    const uniform = buildCylinderGeometry({ radiusTop: 0.1, radiusBottom: 0.1, height: 0.6, radialSegments: 12 });
    const tapered = buildCylinderGeometry({ radiusTop: 0.1, radiusBottom: 0.05, height: 0.6, radialSegments: 12 });
    expect(bottomRingRadius(tapered)).toBeLessThan(bottomRingRadius(uniform));
  });

  it('height が長くなるほど縦方向に伸びる', () => {
    const short = buildCylinderGeometry({ radiusTop: 0.1, radiusBottom: 0.1, height: 0.3, radialSegments: 12 });
    const long = buildCylinderGeometry({ radiusTop: 0.1, radiusBottom: 0.1, height: 0.9, radialSegments: 12 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.max.y - long.boundingBox!.min.y).toBeGreaterThan(
      short.boundingBox!.max.y - short.boundingBox!.min.y,
    );
  });
});

describe('buildTorusGeometry', () => {
  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildTorusGeometry({ radius: 0.1, tube: 0.02, radialSegments: 8, tubularSegments: 16 });
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    const pos = positions(geometry);
    for (let i = 0; i < pos.length; i++) expect(Number.isNaN(pos[i])).toBe(false);
  });

  it('radius が大きくなるほど全体(管の中心線の半径)が広がる', () => {
    const small = buildTorusGeometry({ radius: 0.1, tube: 0.02, radialSegments: 8, tubularSegments: 16 });
    const large = buildTorusGeometry({ radius: 0.3, tube: 0.02, radialSegments: 8, tubularSegments: 16 });
    small.computeBoundingBox();
    large.computeBoundingBox();
    expect(large.boundingBox!.max.x).toBeGreaterThan(small.boundingBox!.max.x);
  });

  it('tube が太くなるほど管そのものが太くなる', () => {
    const thin = buildTorusGeometry({ radius: 0.1, tube: 0.01, radialSegments: 8, tubularSegments: 16 });
    const thick = buildTorusGeometry({ radius: 0.1, tube: 0.05, radialSegments: 8, tubularSegments: 16 });
    thin.computeBoundingBox();
    thick.computeBoundingBox();
    expect(thick.boundingBox!.max.x).toBeGreaterThan(thin.boundingBox!.max.x);
  });
});

describe('buildBoxGeometry', () => {
  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildBoxGeometry({ width: 0.1, height: 0.2, depth: 0.05 });
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    const pos = positions(geometry);
    for (let i = 0; i < pos.length; i++) expect(Number.isNaN(pos[i])).toBe(false);
  });

  it('width/height/depth が各軸のサイズをそれぞれ独立に決める', () => {
    const geometry = buildBoxGeometry({ width: 0.1, height: 0.4, depth: 0.02 });
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.max.x - box.min.x).toBeCloseTo(0.1, 5);
    expect(box.max.y - box.min.y).toBeCloseTo(0.4, 5);
    expect(box.max.z - box.min.z).toBeCloseTo(0.02, 5);
  });
});
