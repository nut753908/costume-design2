import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildShoesGeometry } from '../../geometry/shoes';
import { asNumber } from '../socketHelpers';

export interface ShoesGeneratorData extends Record<string, unknown> {
  soleRadius?: number;
  cuffRadius?: number;
  height?: number;
  toeLength?: number;
  legSpacing?: number;
  segments?: number;
}

registerNodeType<ShoesGeneratorData>({
  type: 'shoesGenerator',
  label: 'Shoes',
  category: 'generator',
  inputs: [
    { id: 'soleRadius', label: 'Sole Radius', type: 'number' },
    { id: 'cuffRadius', label: 'Cuff Radius', type: 'number' },
    { id: 'height', label: 'Height', type: 'number' },
    { id: 'toeLength', label: 'Toe Length', type: 'number' },
    { id: 'legSpacing', label: 'Leg Spacing', type: 'number' },
    { id: 'segments', label: 'Segments', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({
    soleRadius: 0.13,
    cuffRadius: 0.1,
    height: 0.12,
    toeLength: 1.5,
    legSpacing: 0.14,
    segments: 16,
  }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildShoesGeometry({
      soleRadius: asNumber(inputs.soleRadius, data.soleRadius ?? 0.13),
      cuffRadius: asNumber(inputs.cuffRadius, data.cuffRadius ?? 0.1),
      height: asNumber(inputs.height, data.height ?? 0.12),
      toeLength: asNumber(inputs.toeLength, data.toeLength ?? 1.5),
      legSpacing: asNumber(inputs.legSpacing, data.legSpacing ?? 0.14),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 16))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
