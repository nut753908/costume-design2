import { buildSphereGeometry } from '../../../geometry/primitives';
import { defineGeneratorNode } from '../generatorNodeFactory';

/** 球を生成する汎用プリミティブノード。特定のガーメント/パーツに紐付かない
 * (`bodyHeadGroupNode.ts` が頭部として使っているが、それに限らない)。 */
defineGeneratorNode({
  type: 'sphereGenerator',
  label: 'Sphere',
  build: (params) => buildSphereGeometry(params),
  fields: [{ id: 'radius', label: 'Radius', default: 0.16 }],
  extra: { widthSegments: 20, heightSegments: 16 },
});
