import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { buildGlassesGeometry } from '../../geometry/glasses';

export interface GlassesGeneratorData extends Record<string, unknown> {
  lensRadius?: number;
  frameThickness?: number;
  lensSpacing?: number;
  bridgeThickness?: number;
  templeLength?: number;
  templeThickness?: number;
}

function asNumber(v: SocketValue | undefined, fallback: number): number {
  return v?.type === 'number' ? v.value : fallback;
}

registerNodeType<GlassesGeneratorData>({
  type: 'glassesGenerator',
  label: 'Glasses',
  category: 'generator',
  inputs: [
    { id: 'lensRadius', label: 'Lens Radius', type: 'number' },
    { id: 'frameThickness', label: 'Frame Thickness', type: 'number' },
    { id: 'lensSpacing', label: 'Lens Spacing', type: 'number' },
    { id: 'bridgeThickness', label: 'Bridge Thickness', type: 'number' },
    { id: 'templeLength', label: 'Temple Length', type: 'number' },
    { id: 'templeThickness', label: 'Temple Thickness', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({
    lensRadius: 0.045,
    frameThickness: 0.008,
    lensSpacing: 0.055,
    bridgeThickness: 0.01,
    templeLength: 0.12,
    templeThickness: 0.006,
  }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildGlassesGeometry({
      lensRadius: asNumber(inputs.lensRadius, data.lensRadius ?? 0.045),
      frameThickness: asNumber(inputs.frameThickness, data.frameThickness ?? 0.008),
      lensSpacing: asNumber(inputs.lensSpacing, data.lensSpacing ?? 0.055),
      bridgeThickness: asNumber(inputs.bridgeThickness, data.bridgeThickness ?? 0.01),
      templeLength: asNumber(inputs.templeLength, data.templeLength ?? 0.12),
      templeThickness: asNumber(inputs.templeThickness, data.templeThickness ?? 0.006),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
