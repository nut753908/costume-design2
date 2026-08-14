import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildJacketGeometry } from '../../geometry/jacket';
import { asNumber } from '../socketHelpers';

export interface JacketGeneratorData extends Record<string, unknown> {
  shoulderRadius?: number;
  length?: number;
  hemFlare?: number;
  segments?: number;
}

const DEFAULTS = { shoulderRadius: 0.34, length: 0.42, hemFlare: 0.15, segments: 20 };

registerNodeType<JacketGeneratorData>({
  type: 'jacketGenerator',
  label: 'Jacket',
  category: 'generator',
  inputs: [
    { id: 'shoulderRadius', label: 'Shoulder Radius', type: 'number' },
    { id: 'length', label: 'Length', type: 'number' },
    { id: 'hemFlare', label: 'Hem Flare', type: 'number' },
    { id: 'segments', label: 'Segments', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildJacketGeometry({
      shoulderRadius: asNumber(inputs.shoulderRadius, data.shoulderRadius ?? DEFAULTS.shoulderRadius),
      length: asNumber(inputs.length, data.length ?? DEFAULTS.length),
      hemFlare: asNumber(inputs.hemFlare, data.hemFlare ?? DEFAULTS.hemFlare),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? DEFAULTS.segments))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
