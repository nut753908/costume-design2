import { defineGroupNode } from '../groupNodeFactory';

/** 胴体の形を、腰の丸み(球)・肩の丸み(上下につぶした球)と、その間のくびれた回転体で作る
 * グループノード。`bodyGroupNode.ts` が使う。原点が胴体の下端(股)で、+Y へ `length + 2 × radius`
 * の高さまで伸びる(カプセルと同じ高さ)。
 *
 * - `hip`(`sphereGenerator`、半径 `radius`)を `y = radius` に置き、下半分を股の丸みにする。
 * - `shoulder` は同じ半径の球を Y 方向に `shoulderSquash` 倍つぶして、上端がちょうど
 *   `length + 2 × radius` に来る高さに置き、上半分をなで肩にする(胸から首まで長く細らせると、
 *   肩の無い瓶の首のような形になるため)。
 * - 2つの球の赤道の間は、腰 → くびれ(`radius × waistRatio`)→ 胸(`radius`)の2区間の
 *   `easedLatheCurve`(Curve Up)を `translateCurveY` で積み上げて `concatCurve` でつなぎ、
 *   `latheGenerator` で回転体にする(区間の高さは半分ずつ)。
 * 回転体の分割数は球(`sphereGenerator` の widthSegments 20)とそろえる。そろえないと、赤道の
 * 継ぎ目で陰影がギザギザになる。 */
defineGroupNode({
  type: 'torsoShape',
  label: 'Torso Shape',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'length', label: 'Length', type: 'number', default: 0 },
          { id: 'waistRatio', label: 'Waist Ratio', type: 'number', default: 0.88 },
          { id: 'shoulderSquash', label: 'Shoulder Squash', type: 'number', default: 0.6 },
        ],
      },
    },
    { id: 'hip', type: 'sphereGenerator', data: {} },
    { id: 'hipTranslate', type: 'translate', data: {} },

    // 肩の球の中心 = 胸の上端 = radius + span、span = length + radius × (1 - shoulderSquash)
    { id: 'shoulder', type: 'sphereGenerator', data: {} },
    { id: 'shoulderScale', type: 'scale', data: {} },
    { id: 'shoulderTranslate', type: 'translate', data: {} },
    { id: 'oneMinusSquash', type: 'numberSubtract', data: { a: 1 } },
    { id: 'squashGap', type: 'numberMultiply', data: {} },
    { id: 'span', type: 'numberAdd', data: {} },
    { id: 'halfSpan', type: 'numberHalf', data: {} },
    { id: 'chestTopY', type: 'numberAdd', data: {} },
    { id: 'waistY', type: 'numberAdd', data: {} },

    { id: 'waistRadius', type: 'numberMultiply', data: {} },
    { id: 'hipToWaistCurve', type: 'easedLatheCurve', data: {} },
    { id: 'hipToWaistShifted', type: 'translateCurveY', data: {} },
    { id: 'waistToChestCurve', type: 'easedLatheCurve', data: {} },
    { id: 'waistToChestShifted', type: 'translateCurveY', data: {} },
    { id: 'profile', type: 'concatCurve', data: {} },
    { id: 'gen', type: 'latheGenerator', data: { steps: 12, segments: 20 } },

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
    { source: 'input', sourceHandle: 'radius', target: 'hip', targetHandle: 'radius' },
    { source: 'hip', sourceHandle: 'geometry', target: 'hipTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'radius', target: 'hipTranslate', targetHandle: 'y' },

    // span = length + radius × (1 - shoulderSquash)
    { source: 'input', sourceHandle: 'shoulderSquash', target: 'oneMinusSquash', targetHandle: 'b' },
    { source: 'input', sourceHandle: 'radius', target: 'squashGap', targetHandle: 'value' },
    { source: 'oneMinusSquash', sourceHandle: 'value', target: 'squashGap', targetHandle: 'factor' },
    { source: 'input', sourceHandle: 'length', target: 'span', targetHandle: 'a' },
    { source: 'squashGap', sourceHandle: 'value', target: 'span', targetHandle: 'b' },
    { source: 'span', sourceHandle: 'value', target: 'halfSpan', targetHandle: 'value' },
    // chestTopY = radius + span、waistY = radius + span / 2
    { source: 'input', sourceHandle: 'radius', target: 'chestTopY', targetHandle: 'a' },
    { source: 'span', sourceHandle: 'value', target: 'chestTopY', targetHandle: 'b' },
    { source: 'input', sourceHandle: 'radius', target: 'waistY', targetHandle: 'a' },
    { source: 'halfSpan', sourceHandle: 'value', target: 'waistY', targetHandle: 'b' },

    { source: 'input', sourceHandle: 'radius', target: 'shoulder', targetHandle: 'radius' },
    { source: 'shoulder', sourceHandle: 'geometry', target: 'shoulderScale', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'shoulderSquash', target: 'shoulderScale', targetHandle: 'y' },
    { source: 'shoulderScale', sourceHandle: 'geometry', target: 'shoulderTranslate', targetHandle: 'geometry' },
    { source: 'chestTopY', sourceHandle: 'value', target: 'shoulderTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'radius', target: 'waistRadius', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'waistRatio', target: 'waistRadius', targetHandle: 'factor' },

    { source: 'input', sourceHandle: 'radius', target: 'hipToWaistCurve', targetHandle: 'startRadius' },
    { source: 'waistRadius', sourceHandle: 'value', target: 'hipToWaistCurve', targetHandle: 'endRadius' },
    { source: 'halfSpan', sourceHandle: 'value', target: 'hipToWaistCurve', targetHandle: 'distance' },
    { source: 'hipToWaistCurve', sourceHandle: 'up', target: 'hipToWaistShifted', targetHandle: 'curve' },
    { source: 'input', sourceHandle: 'radius', target: 'hipToWaistShifted', targetHandle: 'y' },

    { source: 'waistRadius', sourceHandle: 'value', target: 'waistToChestCurve', targetHandle: 'startRadius' },
    { source: 'input', sourceHandle: 'radius', target: 'waistToChestCurve', targetHandle: 'endRadius' },
    { source: 'halfSpan', sourceHandle: 'value', target: 'waistToChestCurve', targetHandle: 'distance' },
    { source: 'waistToChestCurve', sourceHandle: 'up', target: 'waistToChestShifted', targetHandle: 'curve' },
    { source: 'waistY', sourceHandle: 'value', target: 'waistToChestShifted', targetHandle: 'y' },

    { source: 'hipToWaistShifted', sourceHandle: 'curve', target: 'profile', targetHandle: 'curveA' },
    { source: 'waistToChestShifted', sourceHandle: 'curve', target: 'profile', targetHandle: 'curveB' },
    { source: 'profile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },

    { source: 'hipTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'gen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'shoulderTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'merge', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
