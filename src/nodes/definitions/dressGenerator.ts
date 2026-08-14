import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildDressGeometry } from '../../geometry/dress';
import type { NecklineType } from '../../geometry/neckline';
import { asNumber, asEnum } from '../socketHelpers';

export interface DressGeneratorData extends Record<string, unknown> {
  torsoRadius?: number;
  hemRadius?: number;
  length?: number;
  necklineType?: NecklineType;
  necklineDepth?: number;
}

const DEFAULTS = {
  torsoRadius: 0.29,
  hemRadius: 0.55,
  length: 0.9,
  necklineType: 'round' as NecklineType,
  necklineDepth: 0.12,
};

registerNodeType<DressGeneratorData>({
  type: 'dressGenerator',
  label: 'Dress',
  category: 'generator',
  inputs: [
    { id: 'torsoRadius', label: 'Torso Radius', type: 'number' },
    { id: 'hemRadius', label: 'Hem Radius', type: 'number' },
    { id: 'length', label: 'Length', type: 'number' },
    { id: 'necklineType', label: 'Neckline', type: 'enum' },
    { id: 'necklineDepth', label: 'Neckline Depth', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildDressGeometry({
      torsoRadius: asNumber(inputs.torsoRadius, data.torsoRadius ?? DEFAULTS.torsoRadius),
      hemRadius: asNumber(inputs.hemRadius, data.hemRadius ?? DEFAULTS.hemRadius),
      length: asNumber(inputs.length, data.length ?? DEFAULTS.length),
      necklineType: asEnum<NecklineType>(inputs.necklineType, data.necklineType ?? DEFAULTS.necklineType),
      necklineDepth: asNumber(inputs.necklineDepth, data.necklineDepth ?? DEFAULTS.necklineDepth),
      angleSegments: 24,
      heightSegments: 14,
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
