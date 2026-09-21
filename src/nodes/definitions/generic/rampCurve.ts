import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { FunctionCurve } from '../../../geometry/functionCurve';

/** `y = t`(x=y=0〜1 の斜め線)の曲線を出力する汎用ノード。`Scale Curve Y`/`Translate Curve Y`/
 * `Multiply Curve Y` で y だけを加工すると、x を横軸とした任意の曲線(`generic/necklineShapes.ts` の
 * ネックラインの落ち込み量など)を配線で組み立てられる。 */
registerNodeType({
  type: 'rampCurve',
  label: 'Ramp Curve',
  category: 'curve',
  inputs: [],
  outputs: [{ id: 'curve', label: 'Curve', type: 'curve' }],
  createDefaultData: () => ({}),
  evaluate: (): Record<string, SocketValue> => ({ curve: { type: 'curve', value: new FunctionCurve((t) => t) } }),
});
