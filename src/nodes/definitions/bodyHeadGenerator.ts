import { buildHeadGeometry } from '../../geometry/bodyParts';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'bodyHeadGenerator',
  label: 'Body Head',
  build: (params) => buildHeadGeometry(params),
  fields: [{ id: 'radius', label: 'Radius', default: 0.16 }],
});
