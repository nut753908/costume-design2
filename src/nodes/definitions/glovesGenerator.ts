import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildGlovesGeometry } from '../../geometry/gloves';
import { asNumber } from '../socketHelpers';

export interface GlovesGeneratorData extends Record<string, unknown> {
  wristRadius?: number;
  handRadius?: number;
  length?: number;
  armSpacing?: number;
  segments?: number;
}

const DEFAULTS = { wristRadius: 0.08, handRadius: 0.09, length: 0.14, armSpacing: 0.34, segments: 12 };

registerNodeType<GlovesGeneratorData>({
  type: 'glovesGenerator',
  label: 'Gloves',
  category: 'generator',
  inputs: [
    { id: 'wristRadius', label: 'Wrist Radius', type: 'number' },
    { id: 'handRadius', label: 'Hand Radius', type: 'number' },
    { id: 'length', label: 'Length', type: 'number' },
    { id: 'armSpacing', label: 'Arm Spacing', type: 'number' },
    { id: 'segments', label: 'Segments', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildGlovesGeometry({
      wristRadius: asNumber(inputs.wristRadius, data.wristRadius ?? DEFAULTS.wristRadius),
      handRadius: asNumber(inputs.handRadius, data.handRadius ?? DEFAULTS.handRadius),
      length: asNumber(inputs.length, data.length ?? DEFAULTS.length),
      armSpacing: asNumber(inputs.armSpacing, data.armSpacing ?? DEFAULTS.armSpacing),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? DEFAULTS.segments))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
