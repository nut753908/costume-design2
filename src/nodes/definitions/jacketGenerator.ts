import { buildJacketGeometry } from '../../geometry/jacket';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'jacketGenerator',
  label: 'Jacket',
  build: (params) => buildJacketGeometry(params),
  fields: [
    { id: 'shoulderRadius', label: 'Shoulder Radius', default: 0.34 },
    { id: 'length', label: 'Length', default: 0.42 },
    { id: 'hemFlare', label: 'Hem Flare', default: 0.15 },
    { id: 'segments', label: 'Segments', default: 20, round: true },
  ],
});
