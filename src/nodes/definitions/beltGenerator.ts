import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildBeltGeometry } from '../../geometry/belt';
import { asNumber } from '../socketHelpers';

export interface BeltGeneratorData extends Record<string, unknown> {
  radius?: number;
  thickness?: number;
  bulge?: number;
  segments?: number;
}

const DEFAULTS = { radius: 0.32, thickness: 0.05, bulge: 1.15, segments: 24 };

registerNodeType<BeltGeneratorData>({
  type: 'beltGenerator',
  label: 'Belt',
  category: 'generator',
  inputs: [
    { id: 'radius', label: 'Radius', type: 'number' },
    { id: 'thickness', label: 'Thickness', type: 'number' },
    { id: 'bulge', label: 'Bulge', type: 'number' },
    { id: 'segments', label: 'Segments', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildBeltGeometry({
      radius: asNumber(inputs.radius, data.radius ?? DEFAULTS.radius),
      thickness: asNumber(inputs.thickness, data.thickness ?? DEFAULTS.thickness),
      bulge: asNumber(inputs.bulge, data.bulge ?? DEFAULTS.bulge),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? DEFAULTS.segments))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
