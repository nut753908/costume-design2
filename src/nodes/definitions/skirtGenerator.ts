import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildSkirtGeometry } from '../../geometry/skirt';
import { asNumber } from '../socketHelpers';

export interface SkirtGeneratorData extends Record<string, unknown> {
  waistRadius?: number;
  length?: number;
  flare?: number;
  segments?: number;
}

const DEFAULTS = { waistRadius: 0.34, length: 0.5, flare: 0.6, segments: 24 };

registerNodeType<SkirtGeneratorData>({
  type: 'skirtGenerator',
  label: 'Skirt',
  category: 'generator',
  inputs: [
    { id: 'waistRadius', label: 'Waist Radius', type: 'number' },
    { id: 'length', label: 'Length', type: 'number' },
    { id: 'flare', label: 'Flare', type: 'number' },
    { id: 'segments', label: 'Segments', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildSkirtGeometry({
      waistRadius: asNumber(inputs.waistRadius, data.waistRadius ?? DEFAULTS.waistRadius),
      length: asNumber(inputs.length, data.length ?? DEFAULTS.length),
      flare: asNumber(inputs.flare, data.flare ?? DEFAULTS.flare),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? DEFAULTS.segments))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
