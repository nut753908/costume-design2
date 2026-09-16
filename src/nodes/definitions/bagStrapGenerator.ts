import { buildBagStrapGeometry } from '../../geometry/bag';
import { defineGeneratorNode } from './generatorNodeFactory';

/** 斜めがけストラップだけを生成するノード。バッグ本体(直方体)は `bagGroupNode.ts` 側で
 * `boxGenerator`→`translateX`/`translateY`/`translateZ` というノードグラフに委ねる
 * (`pantsLegGenerator` 等と同じ「単体パーツの生成とノードグラフ側の配置を分離する」形、
 * `geometry/bag.ts` 参照)。 */
defineGeneratorNode({
  type: 'bagStrapGenerator',
  label: 'Bag Strap',
  build: (params) => buildBagStrapGeometry(params),
  fields: [
    { id: 'strapWidth', label: 'Strap Width', default: 0.04 },
    { id: 'strapThickness', label: 'Strap Thickness', default: 0.015 },
    { id: 'shoulderOffset', label: 'Shoulder Offset', default: 0.08 },
    { id: 'hipOffset', label: 'Hip Offset', default: 0.26 },
    { id: 'drop', label: 'Drop', default: 0.55 },
  ],
});
