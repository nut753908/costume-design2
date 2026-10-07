import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { ConcatCurve } from '../../../geometry/concatCurve';

/** 2つの曲線を、`t` の前半を `curveA`、後半を `curveB` としてつないだ1本の曲線にする汎用ノード
 * (`geometry/concatCurve.ts`)。上下2つのプロファイルの連結などに使う。
 * 受け取る側で `Profile Steps` を `n × 2` にすると、`curveA` と `curveB` を `n` 分割ずつ並べた
 * 点列になり、つなぎ目の点は重複しない。 */
registerNodeType({
  type: 'concatCurve',
  label: 'Concat Curve',
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
    return { curve: { type: 'curve', value: new ConcatCurve(inputs.curveA.value, inputs.curveB.value) } };
  },
});
