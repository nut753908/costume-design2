import { defineGroupNode } from '../groupNodeFactory';

/** `bodyGroupNode.ts` 用。ボディの寸法から、胴体・頭・腕・脚をどのY座標に置けば継ぎ目なく積み上がるかを、
 * 四則演算のノードで求める(地面を y=0 とする)。
 * - `waistY` = 脚の高さ(腰は脚の上端)、`legCenterY` = 脚の高さ ÷ 2
 * - 胴体の高さ = 長さ + 半径 × 2(`torsoCapsuleHeight`)、その上端が肩(`shoulderYCalc`)
 * - `headCenterY` = 肩 + 首の長さ + 頭の半径(`neckTopYCalc` が首の上端)
 * - `armCenterY` = 肩 − 腕の長さ ÷ 2 − 胴体の半径 × 0.8(腕の付け根を、肩の頂点から肩の丸みが始まる高さまで下げる) */
defineGroupNode({
  type: 'bodyLayout',
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
    // 首の長さ(固定値。首は胴体の延長として `torsoShape` が作るので、外部入力にはしない)。
    { id: 'neckLength', type: 'numberInput', data: { value: 0.0565 } },
    { id: 'legCenterYCalc', type: 'numberHalf', data: {} },
    { id: 'torsoRadiusDoubled', type: 'numberMultiply', data: { factor: 2 } },
    { id: 'torsoCapsuleHeight', type: 'numberAdd', data: {} },
    { id: 'shoulderYCalc', type: 'numberAdd', data: {} },
    { id: 'neckTopYCalc', type: 'numberAdd', data: {} },
    { id: 'headCenterYCalc', type: 'numberAdd', data: {} },
    { id: 'armLengthHalf', type: 'numberHalf', data: {} },
    { id: 'armTorsoOverlap', type: 'numberMultiply', data: { factor: 0.8 } },
    { id: 'armCenterYStep1', type: 'numberSubtract', data: {} },
    { id: 'armCenterYCalc', type: 'numberSubtract', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'legCenterY', label: 'Leg Center Y', type: 'number' },
          { id: 'waistY', label: 'Waist Y', type: 'number' },
          { id: 'headCenterY', label: 'Head Center Y', type: 'number' },
          { id: 'armCenterY', label: 'Arm Center Y', type: 'number' },
        ],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'legHeight', target: 'legCenterYCalc', targetHandle: 'value' },
    { source: 'legCenterYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'legCenterY' },
    { source: 'input', sourceHandle: 'legHeight', target: 'output', targetHandle: 'waistY' },

    { source: 'input', sourceHandle: 'torsoRadius', target: 'torsoRadiusDoubled', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'torsoLength', target: 'torsoCapsuleHeight', targetHandle: 'a' },
    { source: 'torsoRadiusDoubled', sourceHandle: 'value', target: 'torsoCapsuleHeight', targetHandle: 'b' },
    { source: 'input', sourceHandle: 'legHeight', target: 'shoulderYCalc', targetHandle: 'a' },
    { source: 'torsoCapsuleHeight', sourceHandle: 'value', target: 'shoulderYCalc', targetHandle: 'b' },

    { source: 'shoulderYCalc', sourceHandle: 'value', target: 'neckTopYCalc', targetHandle: 'a' },
    { source: 'neckLength', sourceHandle: 'value', target: 'neckTopYCalc', targetHandle: 'b' },
    { source: 'neckTopYCalc', sourceHandle: 'value', target: 'headCenterYCalc', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'headRadius', target: 'headCenterYCalc', targetHandle: 'b' },
    { source: 'headCenterYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'headCenterY' },

    { source: 'input', sourceHandle: 'armLength', target: 'armLengthHalf', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'torsoRadius', target: 'armTorsoOverlap', targetHandle: 'value' },
    { source: 'shoulderYCalc', sourceHandle: 'value', target: 'armCenterYStep1', targetHandle: 'a' },
    { source: 'armLengthHalf', sourceHandle: 'value', target: 'armCenterYStep1', targetHandle: 'b' },
    { source: 'armCenterYStep1', sourceHandle: 'value', target: 'armCenterYCalc', targetHandle: 'a' },
    { source: 'armTorsoOverlap', sourceHandle: 'value', target: 'armCenterYCalc', targetHandle: 'b' },
    { source: 'armCenterYCalc', sourceHandle: 'value', target: 'output', targetHandle: 'armCenterY' },
  ],
});
