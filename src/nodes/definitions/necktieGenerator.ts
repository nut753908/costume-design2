import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildNecktieGeometry } from '../../geometry/necktie';
import { asNumber } from '../socketHelpers';

export interface NecktieGeneratorData extends Record<string, unknown> {
  knotWidth?: number;
  knotHeight?: number;
  knotThickness?: number;
  bladeTopWidth?: number;
  bladeBottomWidth?: number;
  bladeThickness?: number;
  bladeLength?: number;
}

const DEFAULTS = {
  knotWidth: 0.05,
  knotHeight: 0.04,
  knotThickness: 0.025,
  bladeTopWidth: 0.035,
  bladeBottomWidth: 0.06,
  bladeThickness: 0.008,
  bladeLength: 0.4,
};

registerNodeType<NecktieGeneratorData>({
  type: 'necktieGenerator',
  label: 'Necktie',
  category: 'generator',
  inputs: [
    { id: 'knotWidth', label: 'Knot Width', type: 'number' },
    { id: 'knotHeight', label: 'Knot Height', type: 'number' },
    { id: 'knotThickness', label: 'Knot Thickness', type: 'number' },
    { id: 'bladeTopWidth', label: 'Blade Top Width', type: 'number' },
    { id: 'bladeBottomWidth', label: 'Blade Bottom Width', type: 'number' },
    { id: 'bladeThickness', label: 'Blade Thickness', type: 'number' },
    { id: 'bladeLength', label: 'Blade Length', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildNecktieGeometry({
      knotWidth: asNumber(inputs.knotWidth, data.knotWidth ?? DEFAULTS.knotWidth),
      knotHeight: asNumber(inputs.knotHeight, data.knotHeight ?? DEFAULTS.knotHeight),
      knotThickness: asNumber(inputs.knotThickness, data.knotThickness ?? DEFAULTS.knotThickness),
      bladeTopWidth: asNumber(inputs.bladeTopWidth, data.bladeTopWidth ?? DEFAULTS.bladeTopWidth),
      bladeBottomWidth: asNumber(inputs.bladeBottomWidth, data.bladeBottomWidth ?? DEFAULTS.bladeBottomWidth),
      bladeThickness: asNumber(inputs.bladeThickness, data.bladeThickness ?? DEFAULTS.bladeThickness),
      bladeLength: asNumber(inputs.bladeLength, data.bladeLength ?? DEFAULTS.bladeLength),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
