import { buildPantsLegGeometry } from '../../geometry/pants';
import { defineGeneratorNode } from './generatorNodeFactory';

/** 脚1本ぶんのジオメトリだけを生成するノード。左右2本を ±legSpacing だけ X方向に離して
 * まとめる処理は `pantsGroupNode.ts` 側で `mirrorPair`(汎用グループノード)に委ねる
 * (`bodyLimbGroupNode.ts` が `cylinderGenerator`→`mirrorPair` としているのと同じ形、
 * `geometry/pants.ts` 参照)。以前はこのノード自身が `legSpacing` も受け取り、
 * `buildPantsGeometry()`(内部で `buildMirroredPairGeometry()` を呼ぶ)へそのまま渡す
 * ブラックボックスだった。 */
defineGeneratorNode({
  type: 'pantsLegGenerator',
  label: 'Pants Leg',
  build: (params) => buildPantsLegGeometry(params),
  fields: [
    { id: 'waistRadius', label: 'Waist Radius', default: 0.16 },
    { id: 'hemRadius', label: 'Hem Radius', default: 0.1 },
    { id: 'inseam', label: 'Inseam', default: 0.75 },
    { id: 'segments', label: 'Segments', default: 16, round: true },
  ],
});
