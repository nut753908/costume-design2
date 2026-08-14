import { buildHatGeometry } from '../../geometry/hat';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'hatGenerator',
  label: 'Hat',
  build: (params) => buildHatGeometry(params),
  fields: [
    { id: 'brimRadius', label: 'Brim Radius', default: 0.2 },
    { id: 'crownRadius', label: 'Crown Radius', default: 0.02 },
    { id: 'height', label: 'Height', default: 0.35 },
    { id: 'segments', label: 'Segments', default: 20, round: true },
  ],
});
