import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { asNumber } from '../socketHelpers';

export interface NumberAddData extends Record<string, unknown> {
  a: number;
  b: number;
}

const DEFAULTS = { a: 0, b: 0 };

registerNodeType<NumberAddData>({
  type: 'numberAdd',
  label: 'Add',
  category: 'generator',
  inputs: [
    { id: 'a', label: 'A', type: 'number' },
    { id: 'b', label: 'B', type: 'number' },
  ],
  outputs: [{ id: 'value', label: 'Value', type: 'number' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const a = asNumber(inputs.a, data.a ?? DEFAULTS.a);
    const b = asNumber(inputs.b, data.b ?? DEFAULTS.b);
    return { value: { type: 'number', value: a + b } };
  },
});
