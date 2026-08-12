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
  createDefaultData: () => ({ shoulderRadius: 0.34, length: 0.42, hemFlare: 0.15, segments: 20 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildJacketGeometry({
      shoulderRadius: asNumber(inputs.shoulderRadius, data.shoulderRadius ?? 0.34),
      length: asNumber(inputs.length, data.length ?? 0.42),
      hemFlare: asNumber(inputs.hemFlare, data.hemFlare ?? 0.15),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 20))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
