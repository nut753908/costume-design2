import { buildBagGeometry } from '../../geometry/bag';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'bagGenerator',
  label: 'Bag',
  build: (params) => buildBagGeometry(params),
  fields: [
    { id: 'strapWidth', label: 'Strap Width', default: 0.04 },
    { id: 'strapThickness', label: 'Strap Thickness', default: 0.015 },
    { id: 'shoulderOffset', label: 'Shoulder Offset', default: 0.08 },
    { id: 'hipOffset', label: 'Hip Offset', default: 0.26 },
    { id: 'drop', label: 'Drop', default: 0.55 },
    { id: 'bagWidth', label: 'Bag Width', default: 0.16 },
    { id: 'bagHeight', label: 'Bag Height', default: 0.14 },
    { id: 'bagDepth', label: 'Bag Depth', default: 0.08 },
  ],
});
