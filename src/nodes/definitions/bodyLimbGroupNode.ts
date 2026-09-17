import { defineGroupNode } from './groupNodeFactory';

/** `bodyGroup` にネストされる、左右対称な腕1組・脚1組のどちらにも使う共通のグループノード
 * (`bodyGroup` 内に2インスタンス置く)。ジェネレーターは汎用プリミティブノード
 * `cylinderGenerator`(上下の半径を独立指定できるテーパー円柱)と、左右対称ペアへまとめる
 * 汎用ノード `mirrorPair` の組み合わせ。「手首/足首側を根元よりわずかに細くする」テーパー
 * 比率は `taperRatioIn`(`numberInput`)→`taper`(`numberMultiply`)→
 * `cylinderGen.radiusBottom` という配線へ展開している — `numberMultiply` 等は
 * `data.label` の編集はできても専用の値編集UIを持たないため、四則演算チェーンで使う定数を
 * リテラルのまま `data` に隠すとキャンバス上のどこにも現れなくなる(`nodes/CLAUDE.md` の
 * 「グループノード」節参照)。 */
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
