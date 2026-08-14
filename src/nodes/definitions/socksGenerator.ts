import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildSocksGeometry } from '../../geometry/socks';
import { asNumber } from '../socketHelpers';

export interface SocksGeneratorData extends Record<string, unknown> {
  ankleRadius?: number;
  calfRadius?: number;
  height?: number;
  legSpacing?: number;
  segments?: number;
}

const DEFAULTS = { ankleRadius: 0.09, calfRadius: 0.105, height: 0.22, legSpacing: 0.14, segments: 16 };

registerNodeType<SocksGeneratorData>({
  type: 'socksGenerator',
  label: 'Socks',
  category: 'generator',
  inputs: [
    { id: 'ankleRadius', label: 'Ankle Radius', type: 'number' },
    { id: 'calfRadius', label: 'Calf Radius', type: 'number' },
    { id: 'height', label: 'Height', type: 'number' },
    { id: 'legSpacing', label: 'Leg Spacing', type: 'number' },
    { id: 'segments', label: 'Segments', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildSocksGeometry({
      ankleRadius: asNumber(inputs.ankleRadius, data.ankleRadius ?? DEFAULTS.ankleRadius),
      calfRadius: asNumber(inputs.calfRadius, data.calfRadius ?? DEFAULTS.calfRadius),
      height: asNumber(inputs.height, data.height ?? DEFAULTS.height),
      legSpacing: asNumber(inputs.legSpacing, data.legSpacing ?? DEFAULTS.legSpacing),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? DEFAULTS.segments))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
