import { defineGroupNode } from './groupNodeFactory';

/** geometry を、あらかじめ計算済みのアンカーY(`anchorY`)+`offsetY` が指す実座標へ
 * 平行移動するグループノード。Blender の Geometry Nodes で「別オブジェクトの位置を
 * サンプリングして Translate Geometry に渡す」のと同じ考え方 — 取り付け位置をノードグラフの
 * 外側を流れるメタデータとして運ぶのではなく、ジオメトリの頂点座標そのものに焼き込む。
 * これにより `groupOutput`(そして最終的に `Garments.tsx`)は anchorY/offsetY を一切知る
 * 必要がなくなり、常に「原点に置けば正しい位置になる」geometry+material の2つだけを
 * 扱えばよい。
 *
 * 以前は `anchor`(enum: waist/shoulder/feet/wrist/head)を外部から受け取り、内部にネストした
 * `bodyDimensionsGroup`/`bodyLayoutGroup`(`bodyGroup` が使っているのと同じ2つの計算グループ)
 * と `anchorSelect`(5候補から1つ選ぶ switch ノード)で「このガーメントはどのアンカーを
 * 使うか」を実行時に選んでいた。しかし `bodyDimensionsGroup`/`bodyLayoutGroup` は本来15個の
 * ガーメント全部+`bodyGroup`で共通の1つの計算のはずが、`garmentPlacement` の中に
 * ネストされていたことで15回(+`bodyGroup` 自身の1回)独立に再計算されていた(値は常に
 * 同じだが計算そのものは重複)。さらに、この重複を無くすために計算を `state/initialGraph.ts`
 * 側のトップレベル共有ノード(`bodyDimensions`/`bodyLayout`、`bodyBuild`/`topRadiusScale` と
 * 同じ「共有ノードをトップレベルに置いて複数グループへファンアウトする」パターン)へ
 * 引き上げたところ、「どのアンカーを使うか」を実行時のドロップダウンで選ぶ機能自体が
 * 不要になった — アンカーの選択はもはや「5候補のうちどれを`garmentPlacement`へ配線するか」
 * というグラフ上の配線そのものになったため、`anchor`(enum)と `anchorSelect` ノードは廃止し、
 * 代わりに `anchorY`(すでに選ばれた1つのY座標の生の数値)を直接受け取るだけにした
 * (`nodes/CLAUDE.md` の「グループノード」節、`state/initialGraph.ts` のコメント参照)。
 *
 * この結果 `garmentPlacement` 自身は `numberAdd`(anchorY + offsetY)→`translateY`
 * (`bodyGroup` が胴体/頭/腕/脚の配置に使っているのと同じ、Y座標を数値でそのまま受け取って
 * 平行移動するだけの汎用ノード)という2ノードまで縮小された。 */
defineGroupNode({
  type: 'garmentPlacement',
  label: 'Garment Placement',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'geometry', label: 'Geometry', type: 'geometry' },
          { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 },
          { id: 'offsetY', label: 'Offset Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'offsetAdd', type: 'numberAdd', data: { label: 'Anchor Y + Offset Y' } },
    { id: 'translate', type: 'translateY', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'anchorY', target: 'offsetAdd', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'offsetY', target: 'offsetAdd', targetHandle: 'b' },

    { source: 'input', sourceHandle: 'geometry', target: 'translate', targetHandle: 'geometry' },
    { source: 'offsetAdd', sourceHandle: 'value', target: 'translate', targetHandle: 'y' },
    { source: 'translate', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
