import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';

/** 2つの geometry を1つの BufferGeometry へ結合する汎用ノード。`geometry/mirrorPair.ts` の
 * `buildMirroredPairGeometry()` が内部で行っていた `mergeGeometries()`+`computeVertexNormals()`
 * を、左右対称ペア専用の関数から切り離し、単独のノードとして表現したもの。`mirrorPair`
 * (グループノード、`mirrorPair.ts`)が、X方向へ ± にそれぞれ平行移動した2つの `translateX`
 * の出力を結合するのに使う。片方だけ接続されているときはもう一方をそのまま出力する(配線を
 * 切るだけで、結合するパーツを外せる)。両方とも未接続なら何も出力しない。 */
registerNodeType({
  type: 'mergeGeometry',
  label: 'Merge Geometry',
  category: 'generator',
  inputs: [
    { id: 'geometryA', label: 'Geometry A', type: 'geometry' },
    { id: 'geometryB', label: 'Geometry B', type: 'geometry' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const a = inputs.geometryA?.type === 'geometry' ? inputs.geometryA.value : undefined;
    const b = inputs.geometryB?.type === 'geometry' ? inputs.geometryB.value : undefined;
    if (!a && !b) return {};
    if (!a || !b) return { geometry: { type: 'geometry', value: (a ?? b)! } };
    const merged = mergeGeometries([a, b])!;
    merged.computeVertexNormals();
    return { geometry: { type: 'geometry', value: merged } };
  },
});
