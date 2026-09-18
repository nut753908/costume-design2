import { defineGroupNode } from '../groupNodeFactory';
import { constNumberInput } from '../constNumberInput';

/** `src/state/initialGraph.ts` 側のトップレベル共有ノード(id: `bodyLayout`)としてただ1組
 * だけ存在し、`bodyGroup` と全15ガーメントへファンアウトされる計算グループ —
 * `bodyDimensionsGroupNode.ts` が求めた各部位の半径・長さから、胴体/頭/腕/脚をどのY座標に
 * 置けば継ぎ目なく積み上がるかを numberAdd/numberSubtract/numberMultiply の四則演算
 * チェーンで求める。
 *
 * 地面のY座標 `feetY` は常に0固定(`+feetY` は常に no-op)なので、加算ノードを置かずに
 * `legHeight` をそのまま `waistY`(= `feetY + legHeight`)として使い回している。
 * `feetY`/`waistY`/`shoulderY`/`wristY`/`headCenterY` は `bodyGroup` 自身のメッシュ配置には
 * 使わないが、15ガーメント共通のアンカー候補として `garmentPlacement.ts` の `anchorY` へ
 * 配線されるため出力に含めている。 */
defineGroupNode({
  type: 'bodyLayoutGroup',
  label: 'Body Layout',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'legHeight', label: 'Leg Height', type: 'number', default: 0 },
          { id: 'torsoLength', label: 'Torso Length', type: 'number', default: 0 },
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number', default: 0 },
          { id: 'headRadius', label: 'Head Radius', type: 'number', default: 0 },
          { id: 'armLength', label: 'Arm Length', type: 'number', default: 0 },
        ],
      },
    },
    // 四則演算チェーンで使い回す定数。0.5 は「半分」、2 は「カプセルの両端ぶん」、0.4 は
    // 腕を胴体にわずかに食い込ませる ARM_TORSO_OVERLAP_RATIO(geometry/body.ts の同名定数)に
    // それぞれ対応する。
    { id: 'halfIn', type: 'numberInput', data: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Half' } },
    { id: 'capEndsFactorIn', type: 'numberInput', data: { value: 2, min: 1, max: 3, step: 0.1, label: 'Torso Cap Ends (x2)' } },
    { id: 'armTorsoOverlapRatioIn', type: 'numberInput', data: { value: 0.4, min: 0, max: 1, step: 0.01, label: 'Arm-Torso Overlap Ratio' } },
    // feetY は常に0固定(地面の高さ)。
    constNumberInput('feetYIn', 0, 'Feet Y'),

    { id: 'torsoRadiusDoubled', type: 'numberMultiply', data: { label: 'Torso Radius × 2' } },
    { id: 'torsoCapsuleHeight', type: 'numberAdd', data: { label: 'Torso Capsule Height' } },
    { id: 'torsoCapsuleHeightHalf', type: 'numberMultiply', data: { label: 'Torso Capsule Height × Half' } },
    { id: 'torsoCenterYCalc', type: 'numberAdd', data: { label: 'Torso Center Y' } },
    { id: 'shoulderYCalc', type: 'numberAdd', data: { label: 'Shoulder Y' } },
    { id: 'headCenterYCalc', type: 'numberAdd', data: { label: 'Head Center Y' } },
    { id: 'armLengthHalf', type: 'numberMultiply', data: { label: 'Arm Length × Half' } },
    { id: 'armTorsoOverlap', type: 'numberMultiply', data: { label: 'Arm-Torso Overlap' } },
    { id: 'armCenterYStep1', type: 'numberSubtract', data: { label: 'Shoulder Y − Arm Half' } },
    { id: 'armCenterYCalc', type: 'numberSubtract', data: { label: 'Arm Center Y' } },
    { id: 'legCenterYCalc', type: 'numberMultiply', data: { label: 'Leg Center Y' } },
    { id: 'wristYCalc', type: 'numberSubtract', data: { label: 'Wrist Y' } },

    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'legCenterY', label: 'Leg Center Y', type: 'number' },
          { id: 'torsoCenterY', label: 'Torso Center Y', type: 'number' },
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
    // legCenterY = legHeight * half (= feetY + legHeight/2, feetY=0 のため省略)
    { source: 'input', sourceHandle: 'legHeight', target: 'legCenterYCalc', targetHandle: 'value' },
    { source: 'halfIn', sourceHandle: 'value', target: 'legCenterYCalc', targetHandle: 'factor' },
    { source: 'legCenterYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'legCenterY' },

    // torsoCapsuleHeight = torsoLength + torsoRadius * capEndsFactor(2)
    { source: 'input', sourceHandle: 'torsoRadius', target: 'torsoRadiusDoubled', targetHandle: 'value' },
    { source: 'capEndsFactorIn', sourceHandle: 'value', target: 'torsoRadiusDoubled', targetHandle: 'factor' },
    { source: 'input', sourceHandle: 'torsoLength', target: 'torsoCapsuleHeight', targetHandle: 'a' },
    { source: 'torsoRadiusDoubled', sourceHandle: 'value', target: 'torsoCapsuleHeight', targetHandle: 'b' },

    // torsoCenterY = waistY(=legHeight) + torsoCapsuleHeight * half
    { source: 'torsoCapsuleHeight', sourceHandle: 'value', target: 'torsoCapsuleHeightHalf', targetHandle: 'value' },
    { source: 'halfIn', sourceHandle: 'value', target: 'torsoCapsuleHeightHalf', targetHandle: 'factor' },
    { source: 'input', sourceHandle: 'legHeight', target: 'torsoCenterYCalc', targetHandle: 'a' },
    { source: 'torsoCapsuleHeightHalf', sourceHandle: 'value', target: 'torsoCenterYCalc', targetHandle: 'b' },
    { source: 'torsoCenterYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'torsoCenterY' },

    // shoulderY = waistY(=legHeight) + torsoCapsuleHeight
    { source: 'input', sourceHandle: 'legHeight', target: 'shoulderYCalc', targetHandle: 'a' },
    { source: 'torsoCapsuleHeight', sourceHandle: 'value', target: 'shoulderYCalc', targetHandle: 'b' },

    // headCenterY = shoulderY + headRadius
    { source: 'shoulderYCalc', sourceHandle: 'value', target: 'headCenterYCalc', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'headRadius', target: 'headCenterYCalc', targetHandle: 'b' },
    { source: 'headCenterYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'headCenterY' },

    // armCenterY = shoulderY - armLength * half - torsoRadius * armTorsoOverlapRatio(0.4)
    { source: 'input', sourceHandle: 'armLength', target: 'armLengthHalf', targetHandle: 'value' },
    { source: 'halfIn', sourceHandle: 'value', target: 'armLengthHalf', targetHandle: 'factor' },
    { source: 'input', sourceHandle: 'torsoRadius', target: 'armTorsoOverlap', targetHandle: 'value' },
    { source: 'armTorsoOverlapRatioIn', sourceHandle: 'value', target: 'armTorsoOverlap', targetHandle: 'factor' },
    { source: 'shoulderYCalc', sourceHandle: 'value', target: 'armCenterYStep1', targetHandle: 'a' },
    { source: 'armLengthHalf', sourceHandle: 'value', target: 'armCenterYStep1', targetHandle: 'b' },
    { source: 'armCenterYStep1', sourceHandle: 'value', target: 'armCenterYCalc', targetHandle: 'a' },
    { source: 'armTorsoOverlap', sourceHandle: 'value', target: 'armCenterYCalc', targetHandle: 'b' },
    { source: 'armCenterYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'armCenterY' },

    // feetY = 0(定数)
    { source: 'feetYIn', sourceHandle: 'value', target: 'output', targetHandle: 'feetY' },
    // waistY = legHeight(= feetY + legHeight, feetY=0 のため省略)
    { source: 'input', sourceHandle: 'legHeight', target: 'output', targetHandle: 'waistY' },
    // shoulderY = waistY(=legHeight) + torsoCapsuleHeight(上で計算済みの shoulderYCalc を再利用)
    { source: 'shoulderYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'shoulderY' },
    // wristY = armCenterY - armLength * half
    { source: 'armCenterYCalc', sourceHandle: 'value', target: 'wristYCalc', targetHandle: 'a' },
    { source: 'armLengthHalf', sourceHandle: 'value', target: 'wristYCalc', targetHandle: 'b' },
    { source: 'wristYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'wristY' },
  ],
});
