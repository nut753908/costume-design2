import { buildGloveGeometry } from '../../geometry/gloves';
import { defineGeneratorNode } from './generatorNodeFactory';

/** 手袋1つぶんのジオメトリだけを生成するノード。左右2つを ±armSpacing だけ X方向に離して
 * まとめる処理は `glovesGroupNode.ts` 側で `mirrorPair`(汎用グループノード)に委ねる
 * (`pantsGroupNode.ts`/`bodyLimbGroupNode.ts` と同じ形、`geometry/gloves.ts` 参照)。 */
defineGeneratorNode({
  type: 'gloveGenerator',
  label: 'Glove',
  build: (params) => buildGloveGeometry(params),
  fields: [
    { id: 'wristRadius', label: 'Wrist Radius', default: 0.08 },
    { id: 'handRadius', label: 'Hand Radius', default: 0.09 },
    { id: 'length', label: 'Length', default: 0.14 },
    { id: 'segments', label: 'Segments', default: 12, round: true },
  ],
});
