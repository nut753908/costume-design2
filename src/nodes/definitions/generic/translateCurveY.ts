import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { FunctionCurve } from '../../../geometry/functionCurve';

/** 曲線の Y だけを `y` だけ平行移動する汎用ノード(`translate`(geometry 版)、
 * `translatePointsY`(points 版)の曲線版)。 */
registerNodeType({
  type: 'translateCurveY',
  label: 'Translate Curve Y',
  category: 'curve',
  inputs: [
    { id: 'curve', label: 'Curve', type: 'curve' },
    { id: 'y', label: 'Y', type: 'number', default: 0 },
  ],
  outputs: [{ id: 'curve', label: 'Curve', type: 'curve' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.curve || inputs.curve.type !== 'curve') return {};
    const source = inputs.curve.value;
    const y = asNumber(inputs.y, 0);
    return { curve: { type: 'curve', value: new FunctionCurve((t) => source.getPoint(t).y + y) } };
  },
});
