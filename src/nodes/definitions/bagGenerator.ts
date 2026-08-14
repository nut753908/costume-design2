import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildBagGeometry } from '../../geometry/bag';
import { asNumber } from '../socketHelpers';

export interface BagGeneratorData extends Record<string, unknown> {
  strapWidth?: number;
  strapThickness?: number;
  shoulderOffset?: number;
  hipOffset?: number;
  drop?: number;
  bagWidth?: number;
  bagHeight?: number;
  bagDepth?: number;
}

const DEFAULTS = {
  strapWidth: 0.04,
  strapThickness: 0.015,
  shoulderOffset: 0.08,
  hipOffset: 0.26,
  drop: 0.55,
  bagWidth: 0.16,
  bagHeight: 0.14,
  bagDepth: 0.08,
};

registerNodeType<BagGeneratorData>({
  type: 'bagGenerator',
  label: 'Bag',
  category: 'generator',
  inputs: [
    { id: 'strapWidth', label: 'Strap Width', type: 'number' },
    { id: 'strapThickness', label: 'Strap Thickness', type: 'number' },
    { id: 'shoulderOffset', label: 'Shoulder Offset', type: 'number' },
    { id: 'hipOffset', label: 'Hip Offset', type: 'number' },
    { id: 'drop', label: 'Drop', type: 'number' },
    { id: 'bagWidth', label: 'Bag Width', type: 'number' },
    { id: 'bagHeight', label: 'Bag Height', type: 'number' },
    { id: 'bagDepth', label: 'Bag Depth', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildBagGeometry({
      strapWidth: asNumber(inputs.strapWidth, data.strapWidth ?? DEFAULTS.strapWidth),
      strapThickness: asNumber(inputs.strapThickness, data.strapThickness ?? DEFAULTS.strapThickness),
      shoulderOffset: asNumber(inputs.shoulderOffset, data.shoulderOffset ?? DEFAULTS.shoulderOffset),
      hipOffset: asNumber(inputs.hipOffset, data.hipOffset ?? DEFAULTS.hipOffset),
      drop: asNumber(inputs.drop, data.drop ?? DEFAULTS.drop),
      bagWidth: asNumber(inputs.bagWidth, data.bagWidth ?? DEFAULTS.bagWidth),
      bagHeight: asNumber(inputs.bagHeight, data.bagHeight ?? DEFAULTS.bagHeight),
      bagDepth: asNumber(inputs.bagDepth, data.bagDepth ?? DEFAULTS.bagDepth),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
