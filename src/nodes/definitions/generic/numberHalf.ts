import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

export interface NumberHalfData extends Record<string, unknown> {
  value?: number;
}

const DEFAULTS = { value: 0 };

/** `numberNegate` と同じ単項演算ノードで、`value × 0.5` を計算する。
 * 「長さの半分」を中心座標や管の太さへ使う配線に使う。 */
registerNodeType<NumberHalfData>({
  type: 'numberHalf',
  label: 'Half',
  category: 'generator',
  inputs: [{ id: 'value', label: 'Value', type: 'number', default: DEFAULTS.value }],
  outputs: [{ id: 'value', label: 'Value', type: 'number' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const value = asNumber(inputs.value, data.value ?? DEFAULTS.value);
    return { value: { type: 'number', value: value * 0.5 } };
  },
});
