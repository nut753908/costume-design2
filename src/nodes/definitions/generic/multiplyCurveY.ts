import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { MapYCurve } from '../../../geometry/functionCurve';

/** 2つの曲線の Y 同士を、同じ `t` の位置ごとに掛ける汎用ノード。x は `Curve A` のものを引き継ぐ。 */
registerNodeType({
  type: 'multiplyCurveY',
  label: 'Multiply Curve Y',
  category: 'curve',
  inputs: [
    { id: 'curveA', label: 'Curve A', type: 'curve' },
    { id: 'curveB', label: 'Curve B', type: 'curve' },
  ],
  outputs: [{ id: 'curve', label: 'Curve', type: 'curve' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.curveA || inputs.curveA.type !== 'curve') return {};
    if (!inputs.curveB || inputs.curveB.type !== 'curve') return {};
    const a = inputs.curveA.value;
    const b = inputs.curveB.value;
    return { curve: { type: 'curve', value: new MapYCurve(a, (y, t) => y * b.getPoint(t).y) } };
  },
});
