import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './profileCurve';

const num = (value: number) => ({ type: 'number' as const, value });

function curveOf(inputs: Record<string, ReturnType<typeof num>>) {
  const result = getNodeType('profileCurve').evaluate(inputs, {});
  return result.curve?.type === 'curve' ? result.curve.value : undefined;
}

describe('profileCurve', () => {
  it('r0〜r8 の各制御点の半径は radius × rk で、高さは 0 から length まで等間隔に並ぶ', () => {
    const curve = curveOf({ radius: num(2), length: num(4), r0: num(0), r1: num(0.5), r2: num(1), r3: num(1), r4: num(1), r5: num(1), r6: num(1), r7: num(0.5), r8: num(0) })!;
    expect(curve.getPoint(1 / 8).x).toBeCloseTo(2 * 0.5, 10);
    expect(curve.getPoint(1 / 8).y).toBeCloseTo(0.5, 10);
    expect(curve.getPoint(0.5).x).toBeCloseTo(2, 10);
    expect(curve.getPoint(1).y).toBeCloseTo(4, 10);
  });

  it('未接続なら、両端が閉じた(r0 = r8 = 0)半径1・長さ1の膨らんだ形になる', () => {
    const curve = curveOf({})!;
    expect(curve.getPoint(0).x).toBe(0);
    expect(curve.getPoint(1).x).toBe(0);
    expect(curve.getPoint(0.5).x).toBeCloseTo(1, 10);
    expect(curve.getPoint(0.5).y).toBeCloseTo(0.5, 10);
  });
});
