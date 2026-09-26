import { defineGroupNode } from '../groupNodeFactory';

/** 肩(shoulderY、原点)から下へ垂れる上衣のプロファイル曲線を、胸から首までを肩の丸みで閉じた形で
 * 作るグループノード。top/dress/jacket が `ringGridGenerator`/`latheGenerator` へ渡す。
 *
 * 体の肩は、胸の上端(肩の頂点から `torsoRadius × 0.6` 下)から上を半径 `torsoRadius` の球を
 * 上下 0.6 倍につぶした丸み(`generic/torsoShape.ts`)なので、それに沿わせる:
 * - 肩の丸み(`capCurve`): 胸(`chestRadius`、y = -torsoRadius × 0.6)から首まわり(`neckOpening`、
 *   y = +torsoRadius × 0.1)まで。上端を肩の頂点より少し上にして、体の丸みの外側に収める
 *   (smoothstep は体の楕円より中ほどが細いため、同じ高さで閉じると体が突き抜ける)。
 * - 胴(`bodyCurve`): 胸から裾(`hemRadius`)まで。裾の高さは肩の頂点から `length` 下で、
 *   肩の丸みを付ける前と同じ丈の意味を保つ。
 * `concatCurve` は `t` を半分ずつに分けるので、受け取る側の `Profile Steps` の半分が肩の丸みに
 * 割り当てられる。 */
defineGroupNode({
  type: 'shoulderedProfile',
  label: 'Shouldered Profile',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number', default: 0.14 },
          { id: 'chestRadius', label: 'Chest Radius', type: 'number', default: 0.16 },
          { id: 'hemRadius', label: 'Hem Radius', type: 'number', default: 0.16 },
          { id: 'neckOpening', label: 'Neck Opening', type: 'number', default: 0.07 },
          { id: 'length', label: 'Length', type: 'number', default: 0.5 },
        ],
      },
    },
    { id: 'chestDrop', type: 'numberMultiply', data: { factor: 0.6 } },
    { id: 'capLift', type: 'numberMultiply', data: { factor: 0.1 } },
    { id: 'capHeight', type: 'numberAdd', data: {} },
    { id: 'bodyLength', type: 'numberSubtract', data: {} },
    { id: 'negChestDrop', type: 'numberNegate', data: {} },

    { id: 'capCurve', type: 'easedLatheCurve', data: {} },
    { id: 'capShifted', type: 'translateCurveY', data: {} },
    { id: 'bodyCurve', type: 'easedLatheCurve', data: {} },
    { id: 'bodyShifted', type: 'translateCurveY', data: {} },
    { id: 'profile', type: 'concatCurve', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'curve', label: 'Curve', type: 'curve' }],
      },
    },
  ],
  internalEdges: [
    // chestDrop = torsoRadius × 0.6、capLift = torsoRadius × 0.1、capHeight = chestDrop + capLift
    { source: 'input', sourceHandle: 'torsoRadius', target: 'chestDrop', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'torsoRadius', target: 'capLift', targetHandle: 'value' },
    { source: 'chestDrop', sourceHandle: 'value', target: 'capHeight', targetHandle: 'a' },
    { source: 'capLift', sourceHandle: 'value', target: 'capHeight', targetHandle: 'b' },
    // bodyLength = length - chestDrop
    { source: 'input', sourceHandle: 'length', target: 'bodyLength', targetHandle: 'a' },
    { source: 'chestDrop', sourceHandle: 'value', target: 'bodyLength', targetHandle: 'b' },
    { source: 'chestDrop', sourceHandle: 'value', target: 'negChestDrop', targetHandle: 'value' },

    // 肩の丸み: 首まわり(上端)→ 胸(下端)、capLift だけ上へ
    { source: 'input', sourceHandle: 'neckOpening', target: 'capCurve', targetHandle: 'startRadius' },
    { source: 'input', sourceHandle: 'chestRadius', target: 'capCurve', targetHandle: 'endRadius' },
    { source: 'capHeight', sourceHandle: 'value', target: 'capCurve', targetHandle: 'distance' },
    { source: 'capCurve', sourceHandle: 'down', target: 'capShifted', targetHandle: 'curve' },
    { source: 'capLift', sourceHandle: 'value', target: 'capShifted', targetHandle: 'y' },

    // 胴: 胸(上端)→ 裾(下端)、chestDrop だけ下へ
    { source: 'input', sourceHandle: 'chestRadius', target: 'bodyCurve', targetHandle: 'startRadius' },
    { source: 'input', sourceHandle: 'hemRadius', target: 'bodyCurve', targetHandle: 'endRadius' },
    { source: 'bodyLength', sourceHandle: 'value', target: 'bodyCurve', targetHandle: 'distance' },
    { source: 'bodyCurve', sourceHandle: 'down', target: 'bodyShifted', targetHandle: 'curve' },
    { source: 'negChestDrop', sourceHandle: 'value', target: 'bodyShifted', targetHandle: 'y' },

    { source: 'bodyShifted', sourceHandle: 'curve', target: 'profile', targetHandle: 'curveA' },
    { source: 'capShifted', sourceHandle: 'curve', target: 'profile', targetHandle: 'curveB' },
    { source: 'profile', sourceHandle: 'curve', target: 'output', targetHandle: 'curve' },
  ],
});
