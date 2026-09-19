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
    // 頂点属性が揃っていない geometry 同士は結合できず null が返る(three.js は console.error も
    // 出す)。例外にするとエディタ全体が落ちてしまうため、出力なし(未接続と同じ扱い)にする。
    // uv の有無だけの違い(標準プリミティブは持ち、手組みのチューブ/リンググリッドは持たない)は
    // トゥーンシェーディングでは uv を使わないため、結合を試す前に判定して入力を clone し、uv を
    // 外してから結合する(入力の geometry は評価キャッシュと共有されるため直接は変更しない)。
    const uvMismatch = list.some((g) => !!g.getAttribute('uv') !== !!list[0].getAttribute('uv'));
    const merged = mergeGeometries(
      uvMismatch
        ? list.map((g) => {
            const copy = g.clone();
            copy.deleteAttribute('uv');
            return copy;
          })
        : list,
    );
    if (!merged) return {};
    merged.computeVertexNormals();
    return { geometry: { type: 'geometry', value: merged } };
  },
});
