import { buildSocksGeometry } from '../../geometry/socks';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'socksGenerator',
  label: 'Socks',
  build: (params) => buildSocksGeometry(params),
  fields: [
    { id: 'ankleRadius', label: 'Ankle Radius', default: 0.09 },
    { id: 'calfRadius', label: 'Calf Radius', default: 0.105 },
    { id: 'height', label: 'Height', default: 0.22 },
    { id: 'legSpacing', label: 'Leg Spacing', default: 0.14 },
    { id: 'segments', label: 'Segments', default: 16, round: true },
  ],
});
