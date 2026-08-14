import { buildTopGeometry } from '../../geometry/top';
import type { NecklineType } from '../../geometry/neckline';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'topGenerator',
  label: 'Top',
  build: (params) => buildTopGeometry(params),
  fields: [
    { id: 'torsoRadius', label: 'Torso Radius', default: 0.29 },
    { id: 'length', label: 'Length', default: 0.5 },
    { id: 'necklineType', label: 'Neckline', type: 'enum', default: 'round' as NecklineType },
    { id: 'necklineDepth', label: 'Neckline Depth', default: 0.12 },
  ],
  extra: { angleSegments: 24, heightSegments: 10 },
});
