import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { asNumber } from '../socketHelpers';

export interface NumberMultiplyData extends Record<string, unknown> {
  value?: number;
  factor: number;
}

registerNodeType<NumberMultiplyData>({
  type: 'numberMultiply',
  label: 'Multiply',
  category: 'generator',
  inputs: [
    { id: 'value', label: 'Value', type: 'number' },
    { id: 'factor', label: 'Factor', type: 'number' },
  ],
  outputs: [{ id: 'value', label: 'Value', type: 'number' }],
  createDefaultData: () => ({ value: 1, factor: 2 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const value = asNumber(inputs.value, data.value ?? 0);
    const factor = asNumber(inputs.factor, data.factor);
    return { value: { type: 'number', value: value * factor } };
  },
});
