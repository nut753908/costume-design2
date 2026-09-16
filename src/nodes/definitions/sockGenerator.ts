import { buildSockGeometry } from '../../geometry/socks';
import { defineGeneratorNode } from './generatorNodeFactory';

/** 靴下1本ぶんのジオメトリだけを生成するノード。左右2本を ±legSpacing だけ X方向に離して
 * まとめる処理は `socksGroupNode.ts` 側で `mirrorPair`(汎用グループノード)に委ねる
 * (`pantsGroupNode.ts`/`bodyLimbGroupNode.ts` と同じ形、`geometry/socks.ts` 参照)。 */
defineGeneratorNode({
  type: 'sockGenerator',
  label: 'Sock',
  build: (params) => buildSockGeometry(params),
  fields: [
    { id: 'ankleRadius', label: 'Ankle Radius', default: 0.09 },
    { id: 'calfRadius', label: 'Calf Radius', default: 0.105 },
    { id: 'height', label: 'Height', default: 0.22 },
    { id: 'segments', label: 'Segments', default: 16, round: true },
  ],
});
