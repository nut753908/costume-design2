import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { FunctionCurve } from '../../../geometry/functionCurve';

/** 曲線の Y だけを `factor` 倍する汎用ノード(`Translate Curve Y` の倍率版)。 */
registerNodeType({
  type: 'scaleCurveY',
  label: 'Scale Curve Y',
  category: 'curve',
  inputs: [
    { id: 'curve', label: 'Curve', type: 'curve' },
    { id: 'factor', label: 'Factor', type: 'number', default: 1 },
  ],
  outputs: [{ id: 'curve', label: 'Curve', type: 'curve' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.curve || inputs.curve.type !== 'curve') return {};
    const source = inputs.curve.value;
    const factor = asNumber(inputs.factor, 1);
    return { curve: { type: 'curve', value: new FunctionCurve((t) => source.getPoint(t).y * factor) } };
  },
});
