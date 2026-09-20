import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';

export interface NumberInputData extends Record<string, unknown> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
}

registerNodeType<NumberInputData>({
  type: 'numberInput',
  label: 'Number',
  category: 'input',
  inputs: [],
  outputs: [{ id: 'value', label: 'Value', type: 'number' }],
  createDefaultData: () => ({ value: 1, min: 0, max: 10, step: 0.1 }),
  evaluate: (_inputs, data): Record<string, SocketValue> => ({
    value: { type: 'number', value: data.value },
  }),
});
