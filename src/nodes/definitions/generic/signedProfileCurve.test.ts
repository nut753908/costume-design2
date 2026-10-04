import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './signedProfileCurve';

const num = (value: number) => ({ type: 'number' as const, value });

function curveOf(inputs: Record<string, ReturnType<typeof num>>) {
  const result = getNodeType('signedProfileCurve').evaluate(inputs, {});
  return result.curve?.type === 'curve' ? result.curve.value : undefined;
}

describe('signedProfileCurve', () => {
  it('各制御点の値は radius × rk(負も可)で、高さは 0 から length まで等間隔に並ぶ', () => {
    const curve = curveOf({ radius: num(2), length: num(4), r1: num(-0.5), r2: num(1) })!;
    expect(curve.getPoint(1 / 8).x).toBeCloseTo(-1, 10);
    expect(curve.getPoint(1 / 8).y).toBeCloseTo(0.5, 10);
    expect(curve.getPoint(2 / 8).x).toBeCloseTo(2, 10);
    expect(curve.getPoint(1).y).toBeCloseTo(4, 10);
  });

  it('未接続なら全点 0 で、曲線は常に 0', () => {
    const curve = curveOf({})!;
    for (let t = 0; t <= 1; t += 0.1) expect(curve.getPoint(t).x).toBe(0);
  });
});

describe('signedProfileCurve13 / signedProfileCurve17', () => {
  it('制御点の数は 13 / 17 個で、負の値も通る', () => {
    for (const [type, points] of [['signedProfileCurve13', 13], ['signedProfileCurve17', 17]] as const) {
      const node = getNodeType(type);
      expect(node.inputs.filter((i) => /^r\d+$/.test(i.id))).toHaveLength(points);
      const curve = node.evaluate({ radius: num(2), length: num(4), r1: num(-0.5) }, {}).curve;
      expect(curve?.type === 'curve' && curve.value.getPoint(1 / (points - 1)).x).toBeCloseTo(-1, 10);
    }
  });
});
