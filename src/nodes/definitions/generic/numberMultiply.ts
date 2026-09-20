import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

export interface NumberMultiplyData extends Record<string, unknown> {
  value?: number;
  factor: number;
}

const DEFAULTS = { value: 1, factor: 2 };

registerNodeType<NumberMultiplyData>({
  type: 'numberMultiply',
  label: 'Multiply',
  category: 'generator',
  inputs: [
    { id: 'value', label: 'Value', type: 'number', default: DEFAULTS.value },
    { id: 'factor', label: 'Factor', type: 'number', default: DEFAULTS.factor },
  ],
  outputs: [{ id: 'value', label: 'Value', type: 'number' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const value = asNumber(inputs.value, data.value ?? DEFAULTS.value);
    const factor = asNumber(inputs.factor, data.factor ?? DEFAULTS.factor);
    return { value: { type: 'number', value: value * factor } };
  },
});
