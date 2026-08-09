import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

export interface NumberDisplayData extends Record<string, unknown> {
  label?: string;
}

/** A terminal node that surfaces a numeric value for on-screen inspection — useful for
 * previewing intermediate values in a subgraph, and doubles as the M2 pipeline proof node. */
registerNodeType<NumberDisplayData>({
  type: 'numberDisplay',
  label: 'Number Display',
  category: 'output',
  inputs: [{ id: 'value', label: 'Value', type: 'number' }],
  outputs: [],
  evaluate: (inputs): Record<string, SocketValue> => ({
    value: inputs.value ?? { type: 'number', value: 0 },
  }),
});
