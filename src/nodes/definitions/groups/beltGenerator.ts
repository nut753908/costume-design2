import { buildBeltGeometry } from '../../../geometry/belt';
import { defineGeneratorNode } from '../generatorNodeFactory';

defineGeneratorNode({
  type: 'beltGenerator',
  label: 'Belt',
  build: (params) => buildBeltGeometry(params),
  fields: [
    { id: 'radius', label: 'Radius', default: 0.32 },
    { id: 'thickness', label: 'Thickness', default: 0.05 },
    { id: 'bulge', label: 'Bulge', default: 1.15 },
    { id: 'segments', label: 'Segments', default: 24, round: true },
  ],
});
