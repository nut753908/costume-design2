import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { SignedSplineCurve, SplineProfileCurve } from '../../../geometry/splineProfile';
import { RingSpacingCurve } from '../../../geometry/ringSpacing';
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

  it('前後とも depthProfile の半径(左右対称)', () => {
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

  it('offsetZProfile を繋ぐと、各高さの輪が丸ごとその値だけ前後にずれ、形(X の広がり・Z の幅)は変わらない', () => {
    const base = loft({ profile: curve(0.5), depthProfile: curve(0.5) })!;
    const shifted = loft({
      profile: curve(0.5),
      depthProfile: curve(0.5),
      offsetZProfile: { type: 'curve', value: new SignedSplineCurve([0, 0.1, 0.1, 0.1, -0.05, 0.1, 0.1, 0.1, 0], 1) },
    })!;
    const before = base.getAttribute('position');
    const after = shifted.getAttribute('position');
    let moved = 0;
    for (let i = 0; i < before.count; i++) {
      expect(after.getX(i)).toBeCloseTo(before.getX(i), 10);
      expect(after.getY(i)).toBeCloseTo(before.getY(i), 10);
      moved = Math.max(moved, Math.abs(after.getZ(i) - before.getZ(i)));
    }
    expect(moved).toBeGreaterThan(0.05);
    // 高さ 1/8 の輪(制御点 r1 = 0.1 の高さ)の全頂点が、同じ 0.1 だけ前へずれている
    const ring = 3; // steps 24 の既定で、全 25 リングのうち高さ 3/24 = 1/8 のリング
    for (let i = ring; i < before.count; i += 25) expect(after.getZ(i) - before.getZ(i)).toBeCloseTo(0.1, 6);
  });

  it('offsetZProfile が未接続なら形は変わらない', () => {
    const a = loft({ profile: curve(0.5), depthProfile: curve(0.2) })!;
    const b = loft({ profile: curve(0.5), depthProfile: curve(0.2), offsetZProfile: { type: 'curve', value: new SignedSplineCurve(new Array<number>(7).fill(0), 1) } })!;
    expect(Array.from(b.getAttribute('position').array)).toEqual(Array.from(a.getAttribute('position').array));
  });
});

describe('loftGenerator の tiltProfile', () => {
  const circle = (r: number) => new THREE.LineCurve(new THREE.Vector2(r, 0), new THREE.Vector2(r, 1));
  const constant = (value: number) => ({ type: 'curve' as const, value: new THREE.LineCurve(new THREE.Vector2(value, 0), new THREE.Vector2(value, 1)) });
  const run = (tilt?: number) => {
    const inputs: Record<string, never> = {
      profile: { type: 'curve', value: circle(1) },
      depthProfile: { type: 'curve', value: circle(1) },
      steps: { type: 'number', value: 2 },
      segments: { type: 'number', value: 16 },
      ...(tilt === undefined ? {} : { tiltProfile: constant(tilt) }),
    } as never;
    const out = getNodeType('loftGenerator').evaluate(inputs, {}).geometry;
    return out?.type === 'geometry' ? out.value : undefined;
  };

  it('正の角度で輪の後ろ側(-Z)が上がり、前側(+Z)が下がる', () => {
    const flat = run()!.getAttribute('position');
    const tilted = run(30)!.getAttribute('position');
    let front = -1;
    let back = -1;
    for (let i = 0; i < flat.count; i++) {
      if (Math.abs(flat.getY(i) - 0.5) > 1e-6) continue;
      if (flat.getZ(i) > 0.99) front = i;
      if (flat.getZ(i) < -0.99) back = i;
    }
    const s = Math.sin((30 * Math.PI) / 180);
    expect(tilted.getY(front)).toBeCloseTo(flat.getY(front) - s, 5);
    expect(tilted.getY(back)).toBeCloseTo(flat.getY(back) + s, 5);
    // 傾けた分だけ前後の広がりは cos 倍に縮む(輪の面が傾くので、真上から見た奥行きは短くなる)
    expect(tilted.getZ(front)).toBeCloseTo(Math.cos((30 * Math.PI) / 180), 5);
  });

  it('tiltProfile が未接続、または 0 度なら、輪は水平のまま', () => {
    const a = run()!.getAttribute('position');
    const b = run(0)!.getAttribute('position');
    for (let i = 0; i < a.count; i++) {
      expect(b.getY(i)).toBeCloseTo(a.getY(i), 8);
      expect(b.getZ(i)).toBeCloseTo(a.getZ(i), 8);
    }
  });
});

describe('loftGenerator の ringProfile', () => {
  const runWith = (ring?: number[]) => {
    const inputs: Record<string, unknown> = {
      profile: { type: 'curve', value: new THREE.LineCurve(new THREE.Vector2(1, 0), new THREE.Vector2(1, 10)) },
      steps: { type: 'number', value: 4 },
      segments: { type: 'number', value: 8 },
    };
    if (ring) inputs.ringProfile = { type: 'curve', value: new RingSpacingCurve(ring) };
    const out = getNodeType('loftGenerator').evaluate(inputs as never, {}).geometry;
    const position = (out as { value: THREE.BufferGeometry }).value.getAttribute('position');
    const ys = new Set<number>();
    for (let i = 0; i < position.count; i++) ys.add(Math.round(position.getY(i) * 1e6) / 1e6);
    return [...ys].sort((a, b) => a - b);
  };

  it('ringProfile が未接続なら、輪は等間隔(これまでと同じ)', () => {
    expect(runWith()).toEqual([0, 2.5, 5, 7.5, 10]);
  });

  it('ringProfile の値の高さの割合に輪が置かれる(端の近くに密に置ける)', () => {
    const ys = runWith([0, 0.05, 0.5, 0.95, 1]);
    expect(ys).toEqual([0, 0.5, 5, 9.5, 10]);
  });
});

describe('loftGenerator の pleatProfile', () => {
  const run = (depth?: number, extra: Record<string, unknown> = {}) => {
    const inputs: Record<string, unknown> = {
      profile: { type: 'curve', value: new THREE.LineCurve(new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)) },
      steps: num(2),
      segments: num(32),
      pleatCount: num(4),
      ...extra,
    };
    if (depth !== undefined) inputs.pleatProfile = { type: 'curve', value: new SignedSplineCurve([depth, depth, depth], 1) };
    return loft(inputs)!.getAttribute('position');
  };
  const radiusAt = (position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, angle: number) => {
    for (let i = 0; i < position.count; i++) {
      if (Math.abs(Math.atan2(position.getX(i), position.getZ(i)) - angle) < 1e-6) return Math.hypot(position.getX(i), position.getZ(i));
    }
    throw new Error(`angle ${angle} の頂点が無い`);
  };

  it('山(正面)は半径が 1 + depth 倍、山と山の中間の谷は元の半径のまま', () => {
    const position = run(0.1);
    expect(radiusAt(position, 0)).toBeCloseTo(1.1, 6);
    // 4 個のプリーツの谷は 45° ごと
    expect(radiusAt(position, Math.PI / 4)).toBeCloseTo(1, 6);
    expect(radiusAt(position, Math.PI / 8)).toBeCloseTo(1.05, 6);
  });

  it('pleatProfile が未接続ならプリーツは付かない', () => {
    const position = run();
    expect(radiusAt(position, 0)).toBeCloseTo(1, 6);
  });

  it('depthProfile と併用すると、プリーツを付けた輪を前後に伸縮する', () => {
    const depthProfile = { type: 'curve', value: new THREE.LineCurve(new THREE.Vector2(0.5, 0), new THREE.Vector2(0.5, 1)) };
    const position = run(0.1, { depthProfile });
    expect(radiusAt(position, 0)).toBeCloseTo(0.55, 6);
  });
});
