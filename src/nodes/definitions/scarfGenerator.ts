import { buildScarfGeometry } from '../../geometry/scarf';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'scarfGenerator',
  label: 'Scarf',
  build: (params) => buildScarfGeometry(params),
  fields: [
    { id: 'neckRadius', label: 'Neck Radius', default: 0.19 },
    { id: 'bandThickness', label: 'Band Thickness', default: 0.05 },
    { id: 'tailWidth', label: 'Tail Width', default: 0.09 },
    { id: 'tailLength', label: 'Tail Length', default: 0.35 },
    { id: 'segments', label: 'Segments', default: 20, round: true },
  ],
});
