import { buildBoxGeometry } from '../../geometry/primitives';
import { defineGeneratorNode } from './generatorNodeFactory';

/** 直方体(ボックス)を生成する汎用プリミティブノード。特定のガーメント/パーツに紐付かない
 * (`bag.ts` のバッグ本体、`scarf.ts` のタイ部分が使っているが、それに限らない)。 */
defineGeneratorNode({
  type: 'boxGenerator',
  label: 'Box',
  build: (params) => buildBoxGeometry(params),
  fields: [
    { id: 'width', label: 'Width', default: 0.1 },
    { id: 'height', label: 'Height', default: 0.1 },
    { id: 'depth', label: 'Depth', default: 0.1 },
  ],
});
