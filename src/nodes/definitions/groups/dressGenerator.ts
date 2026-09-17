import { buildDressGeometry } from '../../../geometry/dress';
import type { NecklineType } from '../../../geometry/neckline';
import { defineGeneratorNode } from '../generatorNodeFactory';

defineGeneratorNode({
  type: 'dressGenerator',
  label: 'Dress',
  build: (params) => buildDressGeometry(params),
  fields: [
    { id: 'torsoRadius', label: 'Torso Radius', default: 0.29 },
    { id: 'hemRadius', label: 'Hem Radius', default: 0.55 },
    { id: 'length', label: 'Length', default: 0.9 },
    { id: 'necklineType', label: 'Neckline', type: 'enum', default: 'round' as NecklineType },
    { id: 'necklineDepth', label: 'Neckline Depth', default: 0.12 },
  ],
  extra: { angleSegments: 24, heightSegments: 14 },
});
