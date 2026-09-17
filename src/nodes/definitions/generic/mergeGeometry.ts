import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';

/** 2つの geometry を1つの BufferGeometry へ結合する汎用ノード。`geometry/mirrorPair.ts` の
 * `buildMirroredPairGeometry()` が内部で行っていた `mergeGeometries()`+`computeVertexNormals()`
 * を、左右対称ペア専用の関数から切り離し、単独のノードとして表現したもの。`mirrorPair`
 * (グループノード、`mirrorPair.ts`)が、X方向へ ± にそれぞれ平行移動した2つの `translateX`
 * の出力を結合するのに使う。 */
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
    if (!inputs.geometryA || inputs.geometryA.type !== 'geometry') return {};
    if (!inputs.geometryB || inputs.geometryB.type !== 'geometry') return {};
    const merged = mergeGeometries([inputs.geometryA.value, inputs.geometryB.value])!;
    merged.computeVertexNormals();
    return { geometry: { type: 'geometry', value: merged } };
  },
});
