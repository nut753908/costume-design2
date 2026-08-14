import { buildGlassesGeometry } from '../../geometry/glasses';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'glassesGenerator',
  label: 'Glasses',
  build: (params) => buildGlassesGeometry(params),
  fields: [
    { id: 'lensRadius', label: 'Lens Radius', default: 0.045 },
    { id: 'frameThickness', label: 'Frame Thickness', default: 0.008 },
    { id: 'lensSpacing', label: 'Lens Spacing', default: 0.055 },
    { id: 'bridgeThickness', label: 'Bridge Thickness', default: 0.01 },
    { id: 'templeLength', label: 'Temple Length', default: 0.12 },
    { id: 'templeThickness', label: 'Temple Thickness', default: 0.006 },
  ],
});
