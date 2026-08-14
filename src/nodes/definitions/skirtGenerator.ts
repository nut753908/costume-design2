import { buildSkirtGeometry } from '../../geometry/skirt';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'skirtGenerator',
  label: 'Skirt',
  build: (params) => buildSkirtGeometry(params),
  fields: [
    { id: 'waistRadius', label: 'Waist Radius', default: 0.34 },
    { id: 'length', label: 'Length', default: 0.5 },
    { id: 'flare', label: 'Flare', default: 0.6 },
    { id: 'segments', label: 'Segments', default: 24, round: true },
  ],
});
