import { buildTorsoGeometry } from '../../geometry/bodyParts';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'bodyTorsoGenerator',
  label: 'Body Torso',
  build: (params) => buildTorsoGeometry(params),
  fields: [
    { id: 'radius', label: 'Radius', default: 0.26 },
    { id: 'length', label: 'Length', default: 0.55 },
  ],
});
