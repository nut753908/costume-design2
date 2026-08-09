import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

export interface EnumInputData extends Record<string, unknown> {
  value: string;
  options: string[];
  label?: string;
}

registerNodeType<EnumInputData>({
  type: 'enumInput',
  label: 'Enum',
  category: 'input',
  inputs: [],
  outputs: [{ id: 'value', label: 'Value', type: 'enum' }],
  // Defaults to the neckline options since Top's neckline is currently the only enum consumer.
  createDefaultData: () => ({ value: 'round', options: ['round', 'v', 'square'], label: 'Neckline' }),
  evaluate: (_inputs, data): Record<string, SocketValue> => ({
    value: { type: 'enum', value: data.value },
  }),
});
