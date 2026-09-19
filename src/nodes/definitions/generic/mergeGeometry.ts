import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';

/** 複数の geometry を1つの BufferGeometry へ結合する汎用ノード。`geometries` は複数接続できる
 * 入力ソケット(`SocketDef.multiple`)で、繋いだすべての geometry を結合する — 結合するパーツを
 * 増減するには配線を足す/切るだけでよい(Blender の Join Geometry と同じ形)。1つだけなら
 * そのまま出力し、何も接続されていないか、頂点属性が揃わず結合できない場合は何も出力しない。 */
registerNodeType({
  type: 'mergeGeometry',
  label: 'Merge Geometry',
  category: 'generator',
  inputs: [{ id: 'geometries', label: 'Geometries', type: 'geometry', multiple: true }],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const list = inputs.geometries?.type === 'geometries' ? inputs.geometries.value : [];
    if (list.length === 0) return {};
    if (list.length === 1) return { geometry: { type: 'geometry', value: list[0] } };
    // 頂点属性(uv の有無など)が揃っていない geometry 同士は結合できず null が返る。
    // 例外にするとエディタ全体が落ちてしまうため、出力なし(未接続と同じ扱い)にする。
    const merged = mergeGeometries(list);
    if (!merged) return {};
    merged.computeVertexNormals();
    return { geometry: { type: 'geometry', value: merged } };
  },
});
