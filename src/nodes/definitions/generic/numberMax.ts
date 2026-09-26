import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

export interface NumberMaxData extends Record<string, unknown> {
  a: number;
  b: number;
}

const DEFAULTS = { a: 0, b: 0 };

/** `numberAdd`/`numberSubtract`/`numberMultiply` と対になる、`Math.max(a, b)` を計算する
 * 汎用の二項演算ノード。skirt/jacket の `hemRadius = radius * (1 + Math.max(0, flare))`
 * のように、コード上の `Math.max()` によるクランプをノードグラフ上へ展開する際に使う
 * (`flaredRadius` のフレアの下限、pants の腰の半径の下限)。 */
registerNodeType<NumberMaxData>({
  type: 'numberMax',
  label: 'Number Max',
  category: 'math',
  inputs: [
    { id: 'a', label: 'A', type: 'number', default: DEFAULTS.a },
    { id: 'b', label: 'B', type: 'number', default: DEFAULTS.b },
  ],
  outputs: [{ id: 'value', label: 'Value', type: 'number' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const a = asNumber(inputs.a, data.a ?? DEFAULTS.a);
    const b = asNumber(inputs.b, data.b ?? DEFAULTS.b);
    return { value: { type: 'number', value: Math.max(a, b) } };
  },
});
