import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildPantsGeometry } from '../../geometry/pants';
import { asNumber } from '../socketHelpers';

export interface PantsGeneratorData extends Record<string, unknown> {
  waistRadius?: number;
  hemRadius?: number;
  inseam?: number;
  legSpacing?: number;
  segments?: number;
}

registerNodeType<PantsGeneratorData>({
  type: 'pantsGenerator',
  label: 'Pants',
  category: 'generator',
  inputs: [
    { id: 'waistRadius', label: 'Waist Radius', type: 'number' },
    { id: 'hemRadius', label: 'Hem Radius', type: 'number' },
    { id: 'inseam', label: 'Inseam', type: 'number' },
    { id: 'legSpacing', label: 'Leg Spacing', type: 'number' },
    { id: 'segments', label: 'Segments', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ waistRadius: 0.16, hemRadius: 0.1, inseam: 0.75, legSpacing: 0.14, segments: 16 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildPantsGeometry({
      waistRadius: asNumber(inputs.waistRadius, data.waistRadius ?? 0.16),
      hemRadius: asNumber(inputs.hemRadius, data.hemRadius ?? 0.1),
      inseam: asNumber(inputs.inseam, data.inseam ?? 0.75),
      legSpacing: asNumber(inputs.legSpacing, data.legSpacing ?? 0.14),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 16))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
