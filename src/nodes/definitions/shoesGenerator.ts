import { buildShoesGeometry } from '../../geometry/shoes';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'shoesGenerator',
  label: 'Shoes',
  build: (params) => buildShoesGeometry(params),
  fields: [
    { id: 'soleRadius', label: 'Sole Radius', default: 0.13 },
    { id: 'cuffRadius', label: 'Cuff Radius', default: 0.1 },
    { id: 'height', label: 'Height', default: 0.12 },
    { id: 'toeLength', label: 'Toe Length', default: 1.5 },
    { id: 'legSpacing', label: 'Leg Spacing', default: 0.14 },
    { id: 'segments', label: 'Segments', default: 16, round: true },
  ],
});
