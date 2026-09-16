import { defineGroupNode } from './groupNodeFactory';

/** `bodyGroup` にネストされる、左右対称な腕1組・脚1組のどちらにも使う共通のグループノード
 * (`bodyGroup` 内に2インスタンス置く)。`bodyTorsoGroupNode.ts`/`bodyHeadGroupNode.ts` と
 * 同じ理由・同じ形(Material は共有ノードから外部ソケットで受け取るだけ)で分割した。
 *
 * ジェネレーターは Body 専用の `bodyLimbGenerator` ではなく、汎用プリミティブノード
 * `cylinderGenerator`(`nodes/definitions/cylinderGenerator.ts`、上下の半径を独立指定できる
 * テーパー円柱)と、左右対称ペアへまとめる汎用ノード `mirrorPair`
 * (`nodes/definitions/mirrorPair.ts`、`geometry/mirrorPair.ts` の
 * `buildMirroredPairGeometry()` を1つの geometry 入力向けにラップしたもの)の組み合わせで
 * 表現する。「手首/足首側を根元よりわずかに細くする」というテーパー比率(旧 `bodyParts.ts`
 * の `LIMB_TAPER_RATIO = 0.85` というコード上の固定値)は、`taperRatioIn`(`numberInput`)→
 * `taper`(`numberMultiply`)→`cylinderGen.radiusBottom` という配線そのものへ展開している —
 * `bodyLayoutGroupNode.ts` の `armTorsoOverlapRatioIn` と同じく、四則演算チェーンで使う定数は
 * `numberMultiply`/`numberAdd`/`numberSubtract` 自身の `data` にリテラルとして隠さず、必ず
 * 専用の `numberInput` ノードとして配置してから配線する(そうすることでキャンバス上で値が
 * 見え、かつ編集もできる — `numberMultiply` 等は `data.label` の編集はできても専用の値編集
 * UIを持たないため、リテラルのまま `data` に隠すと数値そのものがキャンバス上のどこにも
 * 現れなくなってしまう)。 */
defineGroupNode({
  type: 'bodyLimbGroup',
  label: 'Body Limb Pair',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'length', label: 'Length', type: 'number', default: 0 },
          { id: 'spacing', label: 'Spacing', type: 'number', default: 0 },
          { id: 'centerY', label: 'Center Y', type: 'number', default: 0 },
          { id: 'material', label: 'Material', type: 'material' },
        ],
      },
    },
    { id: 'taperRatioIn', type: 'numberInput', data: { value: 0.85, min: 0, max: 1, step: 0.01, label: 'Wrist/Ankle Taper Ratio' } },
    { id: 'taper', type: 'numberMultiply', data: { label: 'Wrist/Ankle Taper' } },
    { id: 'gen', type: 'cylinderGenerator', data: {} },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    { id: 'translate', type: 'translateY', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'radius', target: 'gen', targetHandle: 'radiusTop' },
    { source: 'input', sourceHandle: 'radius', target: 'taper', targetHandle: 'value' },
    { source: 'taperRatioIn', sourceHandle: 'value', target: 'taper', targetHandle: 'factor' },
    { source: 'taper', sourceHandle: 'value', target: 'gen', targetHandle: 'radiusBottom' },
    { source: 'input', sourceHandle: 'length', target: 'gen', targetHandle: 'height' },
    { source: 'gen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'spacing', target: 'mirror', targetHandle: 'offset' },
    { source: 'mirror', sourceHandle: 'geometry', target: 'translate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'centerY', target: 'translate', targetHandle: 'y' },
    { source: 'translate', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
  ],
});
