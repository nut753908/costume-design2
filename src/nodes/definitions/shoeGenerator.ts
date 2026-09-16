import { buildShoeGeometry } from '../../geometry/shoes';
import { defineGeneratorNode } from './generatorNodeFactory';

/** 靴1本ぶんのジオメトリだけを生成するノード。左右2本を ±legSpacing だけ X方向に離して
 * まとめる処理は `shoesGroupNode.ts` 側で `mirrorPair`(汎用グループノード)に委ねる
 * (`pantsGroupNode.ts`/`bodyLimbGroupNode.ts` と同じ形、`geometry/shoes.ts` 参照)。 */
defineGeneratorNode({
  type: 'shoeGenerator',
  label: 'Shoe',
  build: (params) => buildShoeGeometry(params),
  fields: [
    { id: 'soleRadius', label: 'Sole Radius', default: 0.13 },
    { id: 'cuffRadius', label: 'Cuff Radius', default: 0.1 },
    { id: 'height', label: 'Height', default: 0.12 },
    { id: 'toeLength', label: 'Toe Length', default: 1.5 },
    { id: 'segments', label: 'Segments', default: 16, round: true },
  ],
});
