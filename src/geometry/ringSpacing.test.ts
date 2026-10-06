import { describe, expect, it } from 'vitest';
import { RingSpacingCurve } from './ringSpacing';

describe('RingSpacingCurve', () => {
  it('制御値が等間隔(k / (n - 1))なら s = u(これまでと同じ等間隔の輪)', () => {
    const curve = new RingSpacingCurve(Array.from({ length: 13 }, (_, k) => k / 12));
    for (const u of [0, 0.1, 0.37, 0.5, 0.82, 1]) expect(curve.getPoint(u).x).toBeCloseTo(u, 8);
  });

  it('両端は 0 と 1 を通り、制御点ではその値になる', () => {
    const curve = new RingSpacingCurve([0, 0.1, 0.5, 0.9, 1]);
    expect(curve.getPoint(0).x).toBeCloseTo(0, 10);
    expect(curve.getPoint(1).x).toBeCloseTo(1, 10);
    expect(curve.getPoint(0.25).x).toBeCloseTo(0.1, 10);
    expect(curve.getPoint(0.5).x).toBeCloseTo(0.5, 10);
  });

  it('u に対して s は単調に増える(輪の順番が入れ替わらない)', () => {
    const curve = new RingSpacingCurve([0, 0.02, 0.03, 0.5, 0.97, 0.98, 1]);
    let prev = -1;
    for (let i = 0; i <= 200; i++) {
      const s = curve.getPoint(i / 200).x;
      expect(s).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = s;
    }
  });

  it('端の近くの制御値を小さくすると、その近くに輪が密に置かれる(s の増え方がゆるくなる)', () => {
    const dense = new RingSpacingCurve([0, 0.02, 0.1, 0.4, 0.7, 0.9, 1]);
    expect(dense.getPoint(1 / 6).x).toBeLessThan(1 / 6);
    expect(dense.getPoint(1 / 6).x).toBeCloseTo(0.02, 10);
  });

  it('下がる値は直前の値へそろえる(単調性を保つ)', () => {
    const curve = new RingSpacingCurve([0, 0.5, 0.3, 1]);
    expect(curve.getPoint(2 / 3).x).toBeCloseTo(0.5, 10);
  });
});
