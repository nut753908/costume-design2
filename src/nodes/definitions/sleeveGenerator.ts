import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildSleeveGeometry } from '../../geometry/sleeve';
import { asNumber } from '../socketHelpers';

export interface SleeveGeneratorData extends Record<string, unknown> {
  attachRadius?: number;
  sleeveRadius?: number;
  sleeveLength?: number;
}

const DEFAULTS = { attachRadius: 0.29, sleeveRadius: 0.085, sleeveLength: 0.22 };

registerNodeType<SleeveGeneratorData>({
  type: 'sleeveGenerator',
  label: 'Sleeves',
  category: 'generator',
  inputs: [
    { id: 'attachRadius', label: 'Attach Radius', type: 'number' },
    { id: 'sleeveRadius', label: 'Sleeve Radius', type: 'number' },
    { id: 'sleeveLength', label: 'Sleeve Length', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildSleeveGeometry({
      attachRadius: asNumber(inputs.attachRadius, data.attachRadius ?? DEFAULTS.attachRadius),
      sleeveRadius: asNumber(inputs.sleeveRadius, data.sleeveRadius ?? DEFAULTS.sleeveRadius),
      sleeveLength: asNumber(inputs.sleeveLength, data.sleeveLength ?? DEFAULTS.sleeveLength),
      segments: 12,
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
