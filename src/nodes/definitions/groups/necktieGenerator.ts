import { buildNecktieGeometry } from '../../../geometry/necktie';
import { defineGeneratorNode } from '../generatorNodeFactory';

defineGeneratorNode({
  type: 'necktieGenerator',
  label: 'Necktie',
  build: (params) => buildNecktieGeometry(params),
  fields: [
    { id: 'knotWidth', label: 'Knot Width', default: 0.05 },
    { id: 'knotHeight', label: 'Knot Height', default: 0.04 },
    { id: 'knotThickness', label: 'Knot Thickness', default: 0.025 },
    { id: 'bladeTopWidth', label: 'Blade Top Width', default: 0.035 },
    { id: 'bladeBottomWidth', label: 'Blade Bottom Width', default: 0.06 },
    { id: 'bladeThickness', label: 'Blade Thickness', default: 0.008 },
    { id: 'bladeLength', label: 'Blade Length', default: 0.4 },
    { id: 'frontDepth', label: 'Front Depth', default: 0.3 },
  ],
});
