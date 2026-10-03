import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { SplineProfileCurve } from '../../../geometry/splineProfile';
import './loftGenerator';

const num = (value: number) => ({ type: 'number' as const, value });
const RADII = [0, 0.8, 1, 0.7, 1, 0.8, 0];
const curve = (scale: number) => ({ type: 'curve' as const, value: new SplineProfileCurve(RADII.map((r) => r * scale), 1) });

function loft(inputs: Record<string, unknown>) {
  const result = getNodeType('loftGenerator').evaluate(inputs as never, {});
  return result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
}

describe('loftGenerator', () => {
  it('depthProfile が未接続なら円断面(X と Z の広がりが同じ)', () => {
    const geometry = loft({ profile: curve(0.5) })!;
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.x).toBeCloseTo(0.5, 2);
    expect(geometry.boundingBox!.max.z).toBeCloseTo(0.5, 2);
  });

  it('depthProfile の半径が Z 方向の広がりを決める(楕円断面)', () => {
    const geometry = loft({ profile: curve(0.5), depthProfile: curve(0.2) })!;
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.x).toBeCloseTo(0.5, 2);
    expect(geometry.boundingBox!.max.z).toBeCloseTo(0.2, 2);
    expect(geometry.boundingBox!.max.y).toBeCloseTo(1, 5);
  });

  it('高さごとに幅と奥行きの比が変わる(くびれの高さでだけ奥行きを絞れる)', () => {
    const wide = curve(0.5).value;
    // 高さ 0.5(r3 = 0.7 の点)の奥行きだけを 0.1 にする
    const depth = { type: 'curve' as const, value: new SplineProfileCurve([0, 0.4, 0.5, 0.1, 0.5, 0.4, 0], 1) };
    const geometry = loft({ profile: { type: 'curve', value: wide }, depthProfile: depth, steps: num(24), segments: num(24) })!;
    const position = geometry.getAttribute('position');
    let zAtMiddle = 0;
    let zNearBottom = 0;
    for (let i = 0; i < position.count; i++) {
      if (Math.abs(position.getY(i) - 0.5) < 0.02) zAtMiddle = Math.max(zAtMiddle, Math.abs(position.getZ(i)));
      if (Math.abs(position.getY(i) - 0.17) < 0.02) zNearBottom = Math.max(zNearBottom, Math.abs(position.getZ(i)));
    }
    expect(zAtMiddle).toBeLessThan(0.15);
    expect(zNearBottom).toBeGreaterThan(0.3);
  });

  it('三角形の巻き順が外向きのまま保たれる(極の面積 0 の三角形は除く)', () => {
    const geometry = loft({ profile: curve(0.5), depthProfile: curve(0.2) })!;
    const index = geometry.getIndex()!;
    const position = geometry.getAttribute('position');
    const [a, b, c] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    let outward = 0;
    let inward = 0;
    for (let i = 0; i < index.count; i += 3) {
      a.fromBufferAttribute(position, index.getX(i));
      b.fromBufferAttribute(position, index.getX(i + 1));
      c.fromBufferAttribute(position, index.getX(i + 2));
      const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
      if (normal.length() < 1e-9) continue;
      const centroid = a.clone().add(b).add(c).divideScalar(3);
      // 断面が楕円でも、軸(Y 軸)から重心へ向かう向きと面の法線は同じ側を向く。
      const radial = new THREE.Vector3(centroid.x, 0, centroid.z);
      if (radial.lengthSq() < 1e-10) continue;
      if (normal.dot(radial) > 0) outward++;
      else inward++;
    }
    expect(outward).toBeGreaterThan(0);
    expect(inward).toBe(0);
  });

  it('profile が未接続なら何も返さない', () => {
    expect(getNodeType('loftGenerator').evaluate({ depthProfile: curve(0.2) }, {})).toEqual({});
  });

  it('steps/segments が頂点数を決める', () => {
    const geometry = loft({ profile: curve(0.5), steps: num(6), segments: num(8) })!;
    expect(geometry.getAttribute('position').count).toBe(7 * 9);
    expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
  });

  it('backProfile を繋ぐと、前(+Z)側は depthProfile、後ろ(-Z)側は backProfile の半径になる', () => {
    const geometry = loft({ profile: curve(0.5), depthProfile: curve(0.3), backProfile: curve(0.1) })!;
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.z).toBeCloseTo(0.3, 2);
    expect(geometry.boundingBox!.min.z).toBeCloseTo(-0.1, 2);
    expect(geometry.boundingBox!.max.x).toBeCloseTo(0.5, 2);
  });

  it('backProfile が未接続なら、前後とも depthProfile(左右対称)', () => {
    const geometry = loft({ profile: curve(0.5), depthProfile: curve(0.3) })!;
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.z).toBeCloseTo(-0.3, 2);
  });

  it('dropProfile を繋ぐと、各高さの輪が丸ごと(極を含めて)その値だけ下がり、形(X・Z の広がり)は変わらない', () => {
    const base = loft({ profile: curve(0.5), depthProfile: curve(0.5) })!;
    const dropped = loft({
      profile: curve(0.5),
      depthProfile: curve(0.5),
      dropProfile: { type: 'curve', value: new SplineProfileCurve([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], 1) },
    })!;
    const before = base.getAttribute('position');
    const after = dropped.getAttribute('position');
    for (let i = 0; i < before.count; i++) {
      expect(after.getY(i)).toBeCloseTo(before.getY(i) - 0.1, 6);
      expect(after.getX(i)).toBeCloseTo(before.getX(i), 10);
      expect(after.getZ(i)).toBeCloseTo(before.getZ(i), 10);
    }
  });

  it('dropProfile が高さによって変わると、その高さの輪だけが下がる(未接続なら変化なし)', () => {
    const base = loft({ profile: curve(0.5), depthProfile: curve(0.5) })!;
    const dropped = loft({
      profile: curve(0.5),
      depthProfile: curve(0.5),
      dropProfile: { type: 'curve', value: new SplineProfileCurve([0.1, 0.1, 0, 0, 0, 0, 0], 1) },
    })!;
    const before = base.getAttribute('position');
    const after = dropped.getAttribute('position');
    let atTop = 0;
    for (let i = 0; i < before.count; i++) if (before.getY(i) > 0.9) atTop = Math.max(atTop, Math.abs(after.getY(i) - before.getY(i)));
    expect(atTop).toBeLessThan(0.02);
    expect(after.getY(0) - before.getY(0)).toBeLessThan(-0.05);
  });
});
