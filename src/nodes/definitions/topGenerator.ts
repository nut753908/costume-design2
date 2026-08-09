import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildTopGeometry, type NecklineType } from '../../geometry/top';

export interface TopGeneratorData extends Record<string, unknown> {
  torsoRadius?: number;
  length?: number;
  necklineType?: NecklineType;
  necklineDepth?: number;
}

function asNumber(v: SocketValue | undefined, fallback: number): number {
  return v?.type === 'number' ? v.value : fallback;
}

function asNecklineType(v: SocketValue | undefined, fallback: NecklineType): NecklineType {
  return v?.type === 'enum' ? (v.value as NecklineType) : fallback;
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
      necklineType: asNecklineType(inputs.necklineType, data.necklineType ?? 'round'),
      necklineDepth: asNumber(inputs.necklineDepth, data.necklineDepth ?? 0.12),
      angleSegments: 24,
      heightSegments: 10,
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
