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
  createDefaultData: () => ({
    strapWidth: 0.04,
    strapThickness: 0.015,
    shoulderOffset: 0.08,
    hipOffset: 0.26,
    drop: 0.55,
    bagWidth: 0.16,
    bagHeight: 0.14,
    bagDepth: 0.08,
  }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildBagGeometry({
      strapWidth: asNumber(inputs.strapWidth, data.strapWidth ?? 0.04),
      strapThickness: asNumber(inputs.strapThickness, data.strapThickness ?? 0.015),
      shoulderOffset: asNumber(inputs.shoulderOffset, data.shoulderOffset ?? 0.08),
      hipOffset: asNumber(inputs.hipOffset, data.hipOffset ?? 0.26),
      drop: asNumber(inputs.drop, data.drop ?? 0.55),
      bagWidth: asNumber(inputs.bagWidth, data.bagWidth ?? 0.16),
      bagHeight: asNumber(inputs.bagHeight, data.bagHeight ?? 0.14),
      bagDepth: asNumber(inputs.bagDepth, data.bagDepth ?? 0.08),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
