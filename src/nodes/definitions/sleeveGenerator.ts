import { buildSleeveGeometry } from '../../geometry/sleeve';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'sleeveGenerator',
  label: 'Sleeves',
  build: (params) => buildSleeveGeometry(params),
  fields: [
    { id: 'attachRadius', label: 'Attach Radius', default: 0.29 },
    { id: 'sleeveRadius', label: 'Sleeve Radius', default: 0.085 },
    { id: 'sleeveLength', label: 'Sleeve Length', default: 0.22 },
  ],
  extra: { segments: 12 },
});
