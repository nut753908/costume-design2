import { defineGroupNode } from '../groupNodeFactory';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';

/** `src/state/initialGraph.ts` 側のトップレベル共有ノード(id: `bodyLayout`)としてただ1組
 * だけ存在し、`bodyGroup` と全14ガーメントへファンアウトされる計算グループ —
 * ボディの寸法(`bodyDimensionDefaults.ts` の固定値)から、胴体/首/頭/腕/脚をどのY座標に
 * 置けば継ぎ目なく積み上がるかを numberAdd/numberSubtract/numberMultiply の四則演算
 * チェーンで求める。
 *
 * 地面のY座標 `feetY`(外部ソケット、既定値 0)は `waistY`(= `feetY + legHeight`)と
 * `legCenterY`(= `feetY + legHeight / 2`)に加算され、そこから積み上がる胴体/頭/腕の
 * Y座標もすべて連動するため、`feetY` を変えると体全体が上下する。
 * 出力のうち `legCenterY`/`headCenterY`/`armCenterY`/`waistY` は `bodyGroup` が胴体・頭・腕・脚の配置に使い、
 * `feetY`/`waistY`/`shoulderY`/`wristY`/`headCenterY` は14ガーメント共通のアンカー候補として
 * `garmentPlacement.ts` の `anchorY` へ配線される。 */
defineGroupNode({
  type: 'bodyLayoutGroup',
  label: 'Body Layout',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'feetY', label: 'Feet Y', type: 'number', default: 0 },
        ],
      },
    },
    // ボディの寸法(固定値。`bodyDimensionDefaults.ts`)。
    { id: 'legHeight', type: 'numberInput', data: { value: BODY_DIMENSIONS.legHeight } },
    { id: 'torsoLength', type: 'numberInput', data: { value: BODY_DIMENSIONS.torsoLength } },
    { id: 'torsoRadius', type: 'numberInput', data: { value: BODY_DIMENSIONS.torsoRadius } },
    { id: 'headRadius', type: 'numberInput', data: { value: BODY_DIMENSIONS.headRadius } },
    { id: 'armLength', type: 'numberInput', data: { value: BODY_DIMENSIONS.armLength } },
    { id: 'neckLength', type: 'numberInput', data: { value: BODY_DIMENSIONS.neckLength } },
    // 四則演算チェーンの比率は各 `numberMultiply` の Factor 入力欄の値: 2 は胴体の高さ(`length + 2 × radius`)の「両端の丸みぶん」
    // (`torsoRadiusDoubled`)、0.8 は腕の付け根を肩の頂点から
    // 肩の丸みが始まる高さ(胸の上端)まで下げる割合(`armTorsoOverlap`、`generic/torsoShape.ts` 参照)。
    // 「半分」は `numberHalf` ノードで表す。

    { id: 'torsoRadiusDoubled', type: 'numberMultiply', data: { factor: 2 } },
    { id: 'torsoCapsuleHeight', type: 'numberAdd', data: {} },
    { id: 'shoulderYCalc', type: 'numberAdd', data: {} },
    { id: 'neckTopYCalc', type: 'numberAdd', data: {} },
    { id: 'headCenterYCalc', type: 'numberAdd', data: {} },
    { id: 'armLengthHalf', type: 'numberHalf', data: {} },
    { id: 'armTorsoOverlap', type: 'numberMultiply', data: { factor: 0.8 } },
    { id: 'armCenterYStep1', type: 'numberSubtract', data: {} },
    { id: 'armCenterYCalc', type: 'numberSubtract', data: {} },
    { id: 'legHeightHalf', type: 'numberHalf', data: {} },
    { id: 'legCenterYCalc', type: 'numberAdd', data: {} },
    { id: 'waistYCalc', type: 'numberAdd', data: {} },
    { id: 'wristYCalc', type: 'numberSubtract', data: {} },

    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'legCenterY', label: 'Leg Center Y', type: 'number' },
          { id: 'headCenterY', label: 'Head Center Y', type: 'number' },
          { id: 'armCenterY', label: 'Arm Center Y', type: 'number' },
          { id: 'feetY', label: 'Feet Y', type: 'number' },
          { id: 'waistY', label: 'Waist Y', type: 'number' },
          { id: 'shoulderY', label: 'Shoulder Y', type: 'number' },
          { id: 'wristY', label: 'Wrist Y', type: 'number' },
        ],
      },
    },
  ],
  internalEdges: [
    // legCenterY = feetY + legHeight * half
    { source: 'legHeight', sourceHandle: 'value', target: 'legHeightHalf', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'feetY', target: 'legCenterYCalc', targetHandle: 'a' },
    { source: 'legHeightHalf', sourceHandle: 'value', target: 'legCenterYCalc', targetHandle: 'b' },
    { source: 'legCenterYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'legCenterY' },

    // torsoCapsuleHeight = torsoLength + torsoRadius * capEndsFactor(2)
    { source: 'torsoRadius', sourceHandle: 'value', target: 'torsoRadiusDoubled', targetHandle: 'value' },
    { source: 'torsoLength', sourceHandle: 'value', target: 'torsoCapsuleHeight', targetHandle: 'a' },
    { source: 'torsoRadiusDoubled', sourceHandle: 'value', target: 'torsoCapsuleHeight', targetHandle: 'b' },

    // waistY = feetY + legHeight
    { source: 'input', sourceHandle: 'feetY', target: 'waistYCalc', targetHandle: 'a' },
    { source: 'legHeight', sourceHandle: 'value', target: 'waistYCalc', targetHandle: 'b' },
    { source: 'waistYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'waistY' },

    // shoulderY = waistY + torsoCapsuleHeight
    { source: 'waistYCalc', sourceHandle: 'value', target: 'shoulderYCalc', targetHandle: 'a' },
    { source: 'torsoCapsuleHeight', sourceHandle: 'value', target: 'shoulderYCalc', targetHandle: 'b' },

    // headCenterY = shoulderY + neckLength + headRadius
    { source: 'shoulderYCalc', sourceHandle: 'value', target: 'neckTopYCalc', targetHandle: 'a' },
    { source: 'neckLength', sourceHandle: 'value', target: 'neckTopYCalc', targetHandle: 'b' },
    { source: 'neckTopYCalc', sourceHandle: 'value', target: 'headCenterYCalc', targetHandle: 'a' },
    { source: 'headRadius', sourceHandle: 'value', target: 'headCenterYCalc', targetHandle: 'b' },
    { source: 'headCenterYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'headCenterY' },

    // armCenterY = shoulderY - armLength * half - torsoRadius * armTorsoOverlapRatio(0.8)
    { source: 'armLength', sourceHandle: 'value', target: 'armLengthHalf', targetHandle: 'value' },
    { source: 'torsoRadius', sourceHandle: 'value', target: 'armTorsoOverlap', targetHandle: 'value' },
    { source: 'shoulderYCalc', sourceHandle: 'value', target: 'armCenterYStep1', targetHandle: 'a' },
    { source: 'armLengthHalf', sourceHandle: 'value', target: 'armCenterYStep1', targetHandle: 'b' },
    { source: 'armCenterYStep1', sourceHandle: 'value', target: 'armCenterYCalc', targetHandle: 'a' },
    { source: 'armTorsoOverlap', sourceHandle: 'value', target: 'armCenterYCalc', targetHandle: 'b' },
    { source: 'armCenterYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'armCenterY' },

    // feetY = 外部入力の feetY をそのまま出力する
    { source: 'input', sourceHandle: 'feetY', target: 'output', targetHandle: 'feetY' },
    // shoulderY = waistY + torsoCapsuleHeight(上で計算済みの shoulderYCalc を再利用)
    { source: 'shoulderYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'shoulderY' },
    // wristY = armCenterY - armLength * half
    { source: 'armCenterYCalc', sourceHandle: 'value', target: 'wristYCalc', targetHandle: 'a' },
    { source: 'armLengthHalf', sourceHandle: 'value', target: 'wristYCalc', targetHandle: 'b' },
    { source: 'wristYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'wristY' },
  ],
});
