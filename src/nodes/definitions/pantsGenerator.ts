import { buildPantsGeometry } from '../../geometry/pants';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'pantsGenerator',
  label: 'Pants',
  build: (params) => buildPantsGeometry(params),
  fields: [
    { id: 'waistRadius', label: 'Waist Radius', default: 0.16 },
    { id: 'hemRadius', label: 'Hem Radius', default: 0.1 },
    { id: 'inseam', label: 'Inseam', default: 0.75 },
    { id: 'legSpacing', label: 'Leg Spacing', default: 0.14 },
    { id: 'segments', label: 'Segments', default: 16, round: true },
  ],
});
