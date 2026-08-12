import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildTopGeometry } from '../../geometry/top';
import type { NecklineType } from '../../geometry/neckline';
import { asNumber, asEnum } from '../socketHelpers';

export interface TopGeneratorData extends Record<string, unknown> {
  torsoRadius?: number;
  length?: number;
  necklineType?: NecklineType;
  necklineDepth?: number;
}

registerNodeType<TopGeneratorData>({
  type: 'topGenerator',
  label: 'Top',
  category: 'generator',
  inputs: [
    { id: 'torsoRadius', label: 'Torso Radius', type: 'number' },
    { id: 'length', label: 'Length', type: 'number' },
    { id: 'necklineType', label: 'Neckline', type: 'enum' },
    { id: 'necklineDepth', label: 'Neckline Depth', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ torsoRadius: 0.29, length: 0.5, necklineType: 'round', necklineDepth: 0.12 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildTopGeometry({
      torsoRadius: asNumber(inputs.torsoRadius, data.torsoRadius ?? 0.29),
      length: asNumber(inputs.length, data.length ?? 0.5),
      necklineType: asEnum<NecklineType>(inputs.necklineType, data.necklineType ?? 'round'),
      necklineDepth: asNumber(inputs.necklineDepth, data.necklineDepth ?? 0.12),
      angleSegments: 24,
      heightSegments: 10,
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
