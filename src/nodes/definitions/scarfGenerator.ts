import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildScarfGeometry } from '../../geometry/scarf';
import { asNumber } from '../socketHelpers';

export interface ScarfGeneratorData extends Record<string, unknown> {
  neckRadius?: number;
  bandThickness?: number;
  tailWidth?: number;
  tailLength?: number;
  segments?: number;
}

registerNodeType<ScarfGeneratorData>({
  type: 'scarfGenerator',
  label: 'Scarf',
  category: 'generator',
  inputs: [
    { id: 'neckRadius', label: 'Neck Radius', type: 'number' },
    { id: 'bandThickness', label: 'Band Thickness', type: 'number' },
    { id: 'tailWidth', label: 'Tail Width', type: 'number' },
    { id: 'tailLength', label: 'Tail Length', type: 'number' },
    { id: 'segments', label: 'Segments', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ neckRadius: 0.19, bandThickness: 0.05, tailWidth: 0.09, tailLength: 0.35, segments: 20 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildScarfGeometry({
      neckRadius: asNumber(inputs.neckRadius, data.neckRadius ?? 0.19),
      bandThickness: asNumber(inputs.bandThickness, data.bandThickness ?? 0.05),
      tailWidth: asNumber(inputs.tailWidth, data.tailWidth ?? 0.09),
      tailLength: asNumber(inputs.tailLength, data.tailLength ?? 0.35),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 20))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
