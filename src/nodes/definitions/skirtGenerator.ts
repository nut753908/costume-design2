import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildSkirtGeometry } from '../../geometry/skirt';

export interface SkirtGeneratorData extends Record<string, unknown> {
  waistRadius?: number;
  length?: number;
  flare?: number;
  segments?: number;
}

function asNumber(v: SocketValue | undefined, fallback: number): number {
  return v?.type === 'number' ? v.value : fallback;
}

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
  createDefaultData: () => ({ waistRadius: 0.34, length: 0.5, flare: 0.6, segments: 24 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildSkirtGeometry({
      waistRadius: asNumber(inputs.waistRadius, data.waistRadius ?? 0.34),
      length: asNumber(inputs.length, data.length ?? 0.5),
      flare: asNumber(inputs.flare, data.flare ?? 0.6),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 24))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
