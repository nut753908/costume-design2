import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './ringSpacingCurve';

const num = (value: number) => ({ type: 'number' as const, value });

describe('ringSpacingCurve', () => {
  it('制御点は 13 個で、既定は等間隔(s = u)', () => {
    const node = getNodeType('ringSpacingCurve');
    expect(node.inputs.filter((i) => /^r\d+$/.test(i.id))).toHaveLength(13);
    const curve = node.evaluate({}, {}).curve;
    expect(curve?.type === 'curve' && curve.value.getPoint(0.3).x).toBeCloseTo(0.3, 8);
  });

  it('値を変えると、その制御点での輪の高さの割合が変わる', () => {
    const curve = getNodeType('ringSpacingCurve').evaluate({ r1: num(0.02) }, {}).curve;
    expect(curve?.type === 'curve' && curve.value.getPoint(1 / 12).x).toBeCloseTo(0.02, 10);
  });
});
