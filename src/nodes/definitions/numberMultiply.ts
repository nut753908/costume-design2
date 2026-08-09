import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

export interface NumberMultiplyData extends Record<string, unknown> {
  value?: number;
  factor: number;
}

function asNumber(value: SocketValue | undefined, fallback: number): number {
  return value?.type === 'number' ? value.value : fallback;
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
