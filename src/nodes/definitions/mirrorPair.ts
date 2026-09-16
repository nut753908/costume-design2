import { defineGroupNode } from './groupNodeFactory';

/** 受け取った1つの geometry を、±offset だけ X方向に離した左右対称なペアへまとめる
 * グループノード。`bodyLimbGroupNode.ts`(腕/脚1組)/`pantsGroupNode.ts`(左右2脚)/
 * `shoesGroupNode.ts`(左右2本)/`glovesGroupNode.ts`(左右2つ)/`socksGroupNode.ts`
 * (左右2本)が使う、全ガーメント共通の左右対称ペア化ノード。
 *
 * 「平行移動して結合する」という処理自体も、Bodyの寸法計算(`bodyDimensionsGroup`/
 * `bodyLayoutGroup`)と同じ理由(ノードグラフを見ただけで何をしているか分かるようにする)で、
 * 単一ノードの `evaluate()` の中にコードとして隠さず、`translateX`(`translateX.ts`、
 * `translateY` の X版)×2 と `mergeGeometry`(`mergeGeometry.ts`、`mergeGeometries()`+
 * `computeVertexNormals()` を切り出したもの)というノードグラフ上に展開している。
 * 入力の `offset` は片方の `translateX` へはそのまま、もう片方へは `negate`
 * (`numberMultiply`)を経由して符号反転してから渡すことで、+offset/-offset それぞれへ
 * 平行移動した2つのコピーを作る。符号反転に使う `-1` は `negate` 自身の `data` にリテラルとして
 * 隠さず、`bodyLayoutGroupNode.ts` の `feetYIn`(常に0固定、`min`/`max` を同じ値にして
 * 動かせないことを示す)と同じ「常に一定の値を持つ `numberInput`」のイディオムで
 * `negativeOneIn` として配置してから配線する(`bodyLimbGroupNode.ts` の `taperRatioIn` 参照)。
 *
 * 以前は Body だけがこのノードを使い、pants/shoes/gloves/socks は自分自身の
 * `build*Geometry()` の中から `geometry/mirrorPair.ts` の `buildMirroredPairGeometry()`
 * (build() コールバックを受け取る高階関数版)を直接呼ぶ別経路だったが、同じ理由(左右結合の
 * 生成チェーンをブラックボックスにしない)で全ガーメントこちらへ移行し、
 * `geometry/mirrorPair.ts`(と単体テスト)は呼び出し元が無くなったため削除した
 * (`geometry/CLAUDE.md` 参照)。 */
defineGroupNode({
  type: 'mirrorPair',
  label: 'Mirror Pair',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'geometry', label: 'Geometry', type: 'geometry' },
          { id: 'offset', label: 'Offset', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'negativeOneIn', type: 'numberInput', data: { value: -1, min: -1, max: -1, step: 0.01, label: 'Negative One' } },
    { id: 'negate', type: 'numberMultiply', data: { label: 'Negate Offset' } },
    { id: 'translateNeg', type: 'translateX', data: {} },
    { id: 'translatePos', type: 'translateX', data: {} },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'offset', target: 'negate', targetHandle: 'value' },
    { source: 'negativeOneIn', sourceHandle: 'value', target: 'negate', targetHandle: 'factor' },
    { source: 'input', sourceHandle: 'geometry', target: 'translateNeg', targetHandle: 'geometry' },
    { source: 'negate', sourceHandle: 'value', target: 'translateNeg', targetHandle: 'x' },
    { source: 'input', sourceHandle: 'geometry', target: 'translatePos', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'offset', target: 'translatePos', targetHandle: 'x' },
    { source: 'translateNeg', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometryA' },
    { source: 'translatePos', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometryB' },
    { source: 'merge', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
