import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildBeltGeometry } from '../../geometry/belt';

export interface BeltGeneratorData extends Record<string, unknown> {
  radius?: number;
  thickness?: number;
  bulge?: number;
  segments?: number;
}

function asNumber(v: SocketValue | undefined, fallback: number): number {
  return v?.type === 'number' ? v.value : fallback;
}

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
  createDefaultData: () => ({ radius: 0.32, thickness: 0.05, bulge: 1.15, segments: 24 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildBeltGeometry({
      radius: asNumber(inputs.radius, data.radius ?? 0.32),
      thickness: asNumber(inputs.thickness, data.thickness ?? 0.05),
      bulge: asNumber(inputs.bulge, data.bulge ?? 1.15),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 24))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
