import { buildGlovesGeometry } from '../../geometry/gloves';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'glovesGenerator',
  label: 'Gloves',
  build: (params) => buildGlovesGeometry(params),
  fields: [
    { id: 'wristRadius', label: 'Wrist Radius', default: 0.08 },
    { id: 'handRadius', label: 'Hand Radius', default: 0.09 },
    { id: 'length', label: 'Length', default: 0.14 },
    { id: 'armSpacing', label: 'Arm Spacing', default: 0.34 },
    { id: 'segments', label: 'Segments', default: 12, round: true },
  ],
});
