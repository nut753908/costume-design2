import { defineGroupNode } from './groupNodeFactory';

/** geometry を、ボディのアンカー(waist/shoulder/feet/wrist/head)+offsetY が指す実座標へ
 * 平行移動するグループノード。Blender の Geometry Nodes で「別オブジェクトの位置を
 * サンプリングして Translate Geometry に渡す」のと同じ考え方 — 取り付け位置をノードグラフの
 * 外側を流れるメタデータとして運ぶのではなく、ジオメトリの頂点座標そのものに焼き込む。
 * これにより `groupOutput`(そして最終的に `Garments.tsx`)は anchor/offsetY を一切知る
 * 必要がなくなり、常に「原点に置けば正しい位置になる」geometry+material の2つだけを
 * 扱えばよい。
 *
 * 以前は `geometry/body.ts` の `computeBodyAnchors(computeBodyLayout(computeBodyDimensions(...)))`
 * をそのまま呼ぶだけのブラックボックスノード(`registerNodeType()` 直書き)だったが、
 * `bodyDimensionsGroupNode.ts`/`bodyLayoutGroupNode.ts` と同じ理由(ノードエディタを見ただけ
 * では何を計算しているノードか分からない)で、`bodyGroup` が使っているのと同じ2つの計算
 * グループを内部にネストして再利用し、そこから先の「anchor で5つの候補Yから1つ選ぶ→
 * offsetY を足す→Y方向に平行移動する」という流れも `anchorSelect`/`numberAdd`/`translateY`
 * という既存の汎用ノードだけでグラフ上に展開した。ダブルクリックで中に入れば実際の計算
 * グラフがそのまま見え、隠れた計算は無い。この置き換えにより `geometry/body.ts`(旧
 * `computeBodyDimensions()`/`computeBodyLayout()`/`computeBodyAnchors()`)を呼ぶ本番コードが
 * 無くなったため、ファイルごと削除した(以前 `bodyDimensions`/`bodyLayout` ノードを廃止した
 * 際に `geometry/body.ts` 自体は残した唯一の理由が「このノードが内部で使い続けている」
 * ことだったため)。
 *
 * `computeBodyAnchors()`(削除前)が返す5つのアンカーはどれも X=0, Z=0(体の中心線上)固定
 * だったため、平行移動は実質 Y方向だけでよく、`bodyGroup` が胴体/頭/腕/脚の配置に使っている
 * のと同じ `translateY`(anchor を使わない、Y座標を数値でそのまま受け取る簡易版)がそのまま
 * 使える。 */
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
          { id: 'anchor', label: 'Anchor', type: 'enum', default: 'waist', options: ['waist', 'shoulder', 'feet', 'wrist', 'head'] },
          { id: 'offsetY', label: 'Offset Y', type: 'number', default: 0 },
          { id: 'bodyHeight', label: 'Body Height', type: 'number', default: 1 },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          { id: 'bodyShoulder', label: 'Body Shoulder', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'dimsGroup', type: 'bodyDimensionsGroup', data: {} },
    { id: 'layoutGroup', type: 'bodyLayoutGroup', data: {} },
    { id: 'anchorSelect', type: 'anchorSelect', data: {} },
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
    { source: 'input', sourceHandle: 'bodyHeight', target: 'dimsGroup', targetHandle: 'heightScale' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'dimsGroup', targetHandle: 'buildScale' },
    { source: 'input', sourceHandle: 'bodyShoulder', target: 'dimsGroup', targetHandle: 'shoulderScale' },

    { source: 'dimsGroup', sourceHandle: 'legHeight', target: 'layoutGroup', targetHandle: 'legHeight' },
    { source: 'dimsGroup', sourceHandle: 'torsoLength', target: 'layoutGroup', targetHandle: 'torsoLength' },
    { source: 'dimsGroup', sourceHandle: 'torsoRadius', target: 'layoutGroup', targetHandle: 'torsoRadius' },
    { source: 'dimsGroup', sourceHandle: 'headRadius', target: 'layoutGroup', targetHandle: 'headRadius' },
    { source: 'dimsGroup', sourceHandle: 'armLength', target: 'layoutGroup', targetHandle: 'armLength' },

    { source: 'input', sourceHandle: 'anchor', target: 'anchorSelect', targetHandle: 'anchor' },
    { source: 'layoutGroup', sourceHandle: 'waistY', target: 'anchorSelect', targetHandle: 'waist' },
    { source: 'layoutGroup', sourceHandle: 'shoulderY', target: 'anchorSelect', targetHandle: 'shoulder' },
    { source: 'layoutGroup', sourceHandle: 'feetY', target: 'anchorSelect', targetHandle: 'feet' },
    { source: 'layoutGroup', sourceHandle: 'wristY', target: 'anchorSelect', targetHandle: 'wrist' },
    { source: 'layoutGroup', sourceHandle: 'headCenterY', target: 'anchorSelect', targetHandle: 'head' },

    { source: 'anchorSelect', sourceHandle: 'value', target: 'offsetAdd', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'offsetY', target: 'offsetAdd', targetHandle: 'b' },

    { source: 'input', sourceHandle: 'geometry', target: 'translate', targetHandle: 'geometry' },
    { source: 'offsetAdd', sourceHandle: 'value', target: 'translate', targetHandle: 'y' },
    { source: 'translate', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
