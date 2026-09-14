import { buildLimbPairGeometry } from '../../geometry/bodyParts';
import { defineGeneratorNode } from './generatorNodeFactory';

/** 腕1組・脚1組のどちらにも使う共通のジェネレーターノード(`bodyGroup` 内に2インスタンス
 * 置く、`bodyLimbGenerator`)。`buildLimbPairGeometry()` は左右対称な円柱1組を1つの
 * ジオメトリへまとめて返す(gloves/shoes/socks の `mirrorPair.ts` 利用と同じ考え方)。 */
defineGeneratorNode({
  type: 'bodyLimbGenerator',
  label: 'Body Limb Pair',
  build: (params) => buildLimbPairGeometry(params),
  fields: [
    { id: 'radius', label: 'Radius', default: 0.1 },
    { id: 'length', label: 'Length', default: 0.6 },
    { id: 'spacing', label: 'Spacing', default: 0.2 },
  ],
});
