import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

export interface NumberNegateData extends Record<string, unknown> {
  value?: number;
}

const DEFAULTS = { value: 0 };

/** `numberAdd`/`numberSubtract`/`numberMultiply`/`numberMax` と対になる、`-value` を計算する
 * 汎用の単項演算ノード。`mirrorPair` の ±offset や、bag/glasses/belt/scarf が使う
 * 「符号を反転させるだけ」の配線に使う。 */
registerNodeType<NumberNegateData>({
  type: 'numberNegate',
  label: 'Number Negate',
  category: 'generator',
  inputs: [{ id: 'value', label: 'Value', type: 'number', default: DEFAULTS.value }],
  outputs: [{ id: 'value', label: 'Value', type: 'number' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const value = asNumber(inputs.value, data.value ?? DEFAULTS.value);
    return { value: { type: 'number', value: -value } };
  },
});
