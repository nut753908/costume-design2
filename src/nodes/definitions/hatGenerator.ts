import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildHatGeometry } from '../../geometry/hat';
import { asNumber } from '../socketHelpers';

export interface HatGeneratorData extends Record<string, unknown> {
  brimRadius?: number;
  crownRadius?: number;
  height?: number;
  segments?: number;
}

registerNodeType<HatGeneratorData>({
  type: 'hatGenerator',
  label: 'Hat',
  category: 'generator',
  inputs: [
    { id: 'brimRadius', label: 'Brim Radius', type: 'number' },
    { id: 'crownRadius', label: 'Crown Radius', type: 'number' },
    { id: 'height', label: 'Height', type: 'number' },
    { id: 'segments', label: 'Segments', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ brimRadius: 0.2, crownRadius: 0.02, height: 0.35, segments: 20 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildHatGeometry({
      brimRadius: asNumber(inputs.brimRadius, data.brimRadius ?? 0.2),
      crownRadius: asNumber(inputs.crownRadius, data.crownRadius ?? 0.02),
      height: asNumber(inputs.height, data.height ?? 0.35),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 20))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
