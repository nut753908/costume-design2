import { buildCapsuleGeometry } from '../../../geometry/primitives';
import { defineGeneratorNode } from '../generatorNodeFactory';

/** カプセル(円柱+半球キャップ)を生成する汎用プリミティブノード。特定のガーメント/パーツに
 * 紐付かない(`bodyTorsoGroupNode.ts` が胴体として使っているが、それに限らない)。
 * cap/radialSegments は見た目に影響するがソケット化するほどの独立した意味を持たない
 * スタイル寄りの値のため `extra` に固定する(他ガーメントの angleSegments 等と同じ扱い)。 */
defineGeneratorNode({
  type: 'capsuleGenerator',
  label: 'Capsule',
  build: (params) => buildCapsuleGeometry(params),
  fields: [
    { id: 'radius', label: 'Radius', default: 0.26 },
    { id: 'length', label: 'Length', default: 0.55 },
  ],
  extra: { capSegments: 4, radialSegments: 16 },
});
