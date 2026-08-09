import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildSleeveGeometry } from '../../geometry/sleeve';

export interface SleeveGeneratorData extends Record<string, unknown> {
  attachRadius?: number;
  sleeveRadius?: number;
  sleeveLength?: number;
}

function asNumber(v: SocketValue | undefined, fallback: number): number {
  return v?.type === 'number' ? v.value : fallback;
}

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
  createDefaultData: () => ({ attachRadius: 0.29, sleeveRadius: 0.085, sleeveLength: 0.22 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildSleeveGeometry({
      attachRadius: asNumber(inputs.attachRadius, data.attachRadius ?? 0.29),
      sleeveRadius: asNumber(inputs.sleeveRadius, data.sleeveRadius ?? 0.085),
      sleeveLength: asNumber(inputs.sleeveLength, data.sleeveLength ?? 0.22),
      segments: 12,
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
