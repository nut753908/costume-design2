import { defineGroupNode } from '../groupNodeFactory';
import { colorSocket, garmentOutput } from '../garmentOutput';

const output = garmentOutput({ y: 0.56, geometry: 'merge' });

/** キャミソールワンピース: 細い肩ひも・胸元がまっすぐでレースの縁(⋂⋂⋂)がある身頃・胸の下から裾へ広がる
 * プリーツのミニ丈のスカート・腰の脇の大きなリボン。
 *
 * - 身頃とスカート: 裾(原点、股のすぐ下)から胸元までの1本の `loftGenerator`。幅・前後の厚み・前後のずらしの3本の輪郭
 *   (`profileCurve17`/`signedProfileCurve17`、`radius` 1 なので値がそのまま長さ)は、胸元では体の断面より少し外、
 *   そこから裾へ台形に広がる値。胴体は後ろへ傾いているので、身頃の輪は上ほど後ろへずらす。
 *   胸元の縁の高さ(前で y 1.099)は、参考画像の肩ひもの足元(緑○)に合わせてある。後ろの上端は前より下がる(`topDrop*`)。
 *   胸元のレースは上端の輪を半円の山の形に持ち上げたもの(`scallopCount`/`scallopHeight`)で、服と地続き。
 *   プリーツの折り目は胸元の少し下から始まり、裾へ向かって深くなる(`pleatProfile`)。
 * - 肩ひも: 肩を一周する楕円の平たい帯。帯の外側の縁の輪を内側より小さくして(円錐の側面)肩の斜面に沿わせ、
 *   後ろへ傾けて肩に掛ける。下半分は身頃と体の中に隠れる。傾きと位置は左右で別々の値(`strapRTilt`/`strapRTranslate`、
 *   `strapLTilt`/`strapLTranslate`。左は右と同じ向きで作って `mirrorX` する)で、既定カメラ(斜め)で見た足元・傾き・
 *   太さを参考画像に合わせてある。
 * - リボン: 別の色(`bowColor`)の2つ目の `sceneOutput`。結び目から外へ広がる羽2枚(付け根から先へ太くなり、
 *   先が丸く閉じる平たい `loftGenerator` を横に倒したもの、`mirrorPair`)と結び目。身頃の表面の向きに合わせて回し、
 *   腰の脇に置く。身頃と同じ取り付け位置(`placementY`)だけ持ち上げる。 */
defineGroupNode({
  type: 'camisoleDressGroup',
  label: 'Camisole Dress',
  paletteSection: 'garment',
  internalNodes: [
    { id: 'input', type: 'groupInput', data: { sockets: [colorSocket('#f8f8f8')] } },

    // --- 身頃+スカート(裾が原点、胸元まで 0.539) ---
    { id: 'dressLength', type: 'numberInput', data: { value: 0.539 } },
    {
      id: 'xProfile',
      type: 'profileCurve33',
      data: { r0: 0.27, r1: 0.262061, r2: 0.25422, r3: 0.24638, r4: 0.238539, r5: 0.230704, r6: 0.222775, r7: 0.214828, r8: 0.206978, r9: 0.199139, r10: 0.191308, r11: 0.183379, r12: 0.175515, r13: 0.16768, r14: 0.159848, r15: 0.151934, r16: 0.144028, r17: 0.136688, r18: 0.132685, r19: 0.129408, r20: 0.126422, r21: 0.124832, r22: 0.123225, r23: 0.121637, r24: 0.124628, r25: 0.132099, r26: 0.134745, r27: 0.134174, r28: 0.129284, r29: 0.128247, r30: 0.139796, r31: 0.146695, r32: 0.142261 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve33',
      data: { r0: 0.21, r1: 0.203138, r2: 0.19638, r3: 0.189422, r4: 0.182652, r5: 0.175803, r6: 0.168939, r7: 0.162082, r8: 0.155213, r9: 0.148445, r10: 0.141605, r11: 0.134738, r12: 0.127883, r13: 0.121008, r14: 0.114245, r15: 0.107332, r16: 0.100474, r17: 0.094189, r18: 0.091632, r19: 0.091757, r20: 0.093146, r21: 0.094709, r22: 0.095917, r23: 0.097254, r24: 0.099704, r25: 0.100628, r26: 0.099237, r27: 0.099315, r28: 0.098651, r29: 0.107138, r30: 0.107009, r31: 0.09221, r32: 0.093855 },
    },
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve33',
      data: { r0: 0, r1: -0.00098, r2: -0.00196, r3: -0.002941, r4: -0.003915, r5: -0.004994, r6: -0.005976, r7: -0.007048, r8: -0.008044, r9: -0.009019, r10: -0.01, r11: -0.01098, r12: -0.01196, r13: -0.012942, r14: -0.013913, r15: -0.014961, r16: -0.016031, r17: -0.016906, r18: -0.020514, r19: -0.024318, r20: -0.027873, r21: -0.032962, r22: -0.038711, r23: -0.044858, r24: -0.051369, r25: -0.057622, r26: -0.063758, r27: -0.070958, r28: -0.077546, r29: -0.094185, r30: -0.102336, r31: -0.096189, r32: -0.105863 },
    },
    // 輪を前後へ傾ける角度(度)。上端は前から後ろへ下がり(負)、裾は前から後ろへ上がる(正)。
    {
      id: 'tiltProfile',
      type: 'signedProfileCurve33',
      data: { r0: 18, r1: 16.957866, r2: 15.915833, r3: 14.873706, r4: 13.831567, r5: 12.789533, r6: 11.74741, r7: 10.705275, r8: 9.663144, r9: 8.621013, r10: 7.578875, r11: 6.536813, r12: 5.494784, r13: 4.452379, r14: 3.411637, r15: 2.364304, r16: 1.341933, r17: 0.247696, r18: -0.05911, r19: 0.016642, r20: -0.004664, r21: 0.001302, r22: -0.000362, r23: 0.0001, r24: -0.000028, r25: 0.000008, r26: -0.000002, r27: 0.000001, r28: 0, r29: 0, r30: 0, r31: 0, r32: 0 },
    },
    {
      id: 'pleatProfile',
      type: 'signedProfileCurve33',
      data: { r0: 0.14, r1: 0.14, r2: 0.140001, r3: 0.139995, r4: 0.140023, r5: 0.139897, r6: 0.140443, r7: 0.131466, r8: 0.116691, r9: 0.101782, r10: 0.087236, r11: 0.073028, r12: 0.059283, r13: 0.046103, r14: 0.033482, r15: 0.021623, r16: 0.010857, r17: 0.001785, r18: -0.00042, r19: 0.000118, r20: -0.000033, r21: 0.000009, r22: -0.000003, r23: 0.000001, r24: 0, r25: 0, r26: 0, r27: 0, r28: 0, r29: 0, r30: 0, r31: 0, r32: 0 },
    },
    {
      id: 'dressGen',
      type: 'loftGenerator',
      data: { steps: 72, segments: 336, pleatCount: 14, scallopCount: 48, scallopHeight: 0.006, topDropDepth: 0.057, topDropStart: 0.25, topDropEnd: 0.6729 },
    },

    // --- 肩ひも(左右) ---
    // 肩を一周する楕円の平たい帯(幅 `strapWidth`)。Y 方向に帯の幅だけ伸ばした楕円の輪を横(X)へ倒し、後ろへ傾けて肩に掛ける。
    // 輪の半径の曲線は、`r0` が内側の縁、`r8` が外側の縁(段数が1なので両端だけが効く)。外側を小さくすると、肩が外へ下がる
    // 斜面に帯が沿う。幅・半径・傾き・位置は、見える部分が肌(と服の上端)のすぐ外(平均 3〜4mm、最大でも 6mm ほど)を通り、
    // 既定カメラで見た参考画像の細い肩ひもの足元・傾き・太さに近づくよう当てはめた値。左右で値が違うのは、斜めから見ると
    // カメラに近い右側ほど、後ろへ回る帯が大きく傾いて見えるため。下半分は体の中に隠れる。
    { id: 'strapWidth', type: 'numberInput', data: { value: 0.0123 } },
    { id: 'strapRingY', type: 'profileCurve', data: { radius: 0.115, r0: 1, r1: 0.9908, r2: 0.9816, r3: 0.9724, r4: 0.9632, r5: 0.954, r6: 0.9449, r7: 0.9357, r8: 0.9265 } },
    { id: 'strapRingZ', type: 'profileCurve', data: { radius: 0.0676, r0: 1, r1: 0.9911, r2: 0.9822, r3: 0.9733, r4: 0.9644, r5: 0.9555, r6: 0.9466, r7: 0.9377, r8: 0.9287 } },
    { id: 'strapGen', type: 'loftGenerator', data: { steps: 1, segments: 96 } },
    { id: 'strapHalfWidth', type: 'numberHalf', data: {} },
    { id: 'strapNegHalf', type: 'numberNegate', data: {} },
    { id: 'strapCenter', type: 'translate', data: {} },
    { id: 'strapLay', type: 'rotate', data: { z: -90 } },
    { id: 'strapRTilt', type: 'rotate', data: { x: -26.974, y: -0.4213, z: 2.4791 } },
    { id: 'strapRTranslate', type: 'translate', data: { x: 0.0965, y: 0.5316, z: -0.1077 } },
    { id: 'strapLTilt', type: 'rotate', data: { x: -22.4536, y: -1.9711, z: -20.8994 } },
    { id: 'strapLTranslate', type: 'translate', data: { x: 0.0925, y: 0.5094, z: -0.1023 } },
    { id: 'strapLMirror', type: 'mirrorX', data: {} },

    { id: 'merge', type: 'mergeGeometry', data: {} },
    // 白の影は肌色寄りの既定の倍率だと黄ばんで見えるので、少し青みのある灰色にする。
    // スカートは裾が開いていて内側が見えるので、裏面も描く(片面だと裾の奥が抜けて背景が見える)。
    ...output.nodes.map((n) =>
      n.id === 'shade' ? { ...n, data: { r: 0.86, g: 0.87, b: 0.92 } } : n.id === 'material' ? { ...n, data: { doubleSided: 1 } } : n,
    ),
    { id: 'placementY', type: 'numberInput', data: { value: 0.56 } },

    // --- リボン(腰の脇、別の色) ---
    // 羽: 付け根(結び目側)から先へ太くなり、先が丸く閉じる平たい形を Y 方向に作り、横(+X)へ倒す。
    { id: 'bowWingLength', type: 'numberInput', data: { value: 0.075 } },
    { id: 'bowWingWidth', type: 'profileCurve', data: { radius: 0.045, r0: 0.32, r1: 0.45, r2: 0.58, r3: 0.7, r4: 0.8, r5: 0.88, r6: 0.94, r7: 0.94, r8: 0 } },
    { id: 'bowWingDepth', type: 'profileCurve', data: { radius: 0.022, r0: 0.6, r1: 0.8, r2: 0.95, r3: 1, r4: 1, r5: 1, r6: 0.95, r7: 0.8, r8: 0 } },
    { id: 'bowWingGen', type: 'loftGenerator', data: { steps: 24, segments: 32 } },
    { id: 'bowWingLay', type: 'rotate', data: { z: -90 } },
    { id: 'bowWings', type: 'mirrorPair', data: { offset: 0.004 } },
    { id: 'bowKnotGen', type: 'sphereGenerator', data: { radius: 0.02 } },
    { id: 'bowKnotScale', type: 'scale', data: { x: 0.65, y: 1.5, z: 0.9 } },
    { id: 'bowMerge', type: 'mergeGeometry', data: {} },
    // 羽の後ろの層: 前の層を少し大きくして後ろへずらし、上下の縁からのぞかせる(リボンの輪の内側)。
    // 前の層より暗い色(`bowShade` の色)の別のメッシュにする。
    { id: 'bowBackScale', type: 'scale', data: { x: 1.0, y: 1.12 } },
    { id: 'bowBackShift', type: 'translate', data: { z: -0.012 } },
    { id: 'bowBackWings', type: 'mirrorPair', data: { offset: 0.004 } },
    // 右の羽が上がるように少し回し(`bowRollZ`)、身頃の表面の向きに合わせて外へ向け(`bowTurnY`)、腰の脇に置く。
    // 前の層と後ろの層で同じ値を使う。
    { id: 'bowRollZ', type: 'numberInput', data: { value: 13 } },
    { id: 'bowTurnY', type: 'numberInput', data: { value: 32 } },
    { id: 'bowX', type: 'numberInput', data: { value: 0.155 } },
    { id: 'bowY', type: 'numberInput', data: { value: 0.35 } },
    { id: 'bowZ', type: 'numberInput', data: { value: 0.0765 } },
    { id: 'bowRoll', type: 'rotate', data: {} },
    { id: 'bowTurn', type: 'rotate', data: {} },
    { id: 'bowTranslate', type: 'translate', data: {} },
    { id: 'bowPlacement', type: 'translate', data: {} },
    { id: 'bowBackRoll', type: 'rotate', data: {} },
    { id: 'bowBackTurn', type: 'rotate', data: {} },
    { id: 'bowBackTranslate', type: 'translate', data: {} },
    { id: 'bowBackPlacement', type: 'translate', data: {} },
    { id: 'bowColor', type: 'colorInput', data: { hex: '#fbbcc5' } },
    { id: 'bowShade', type: 'shadeColor', data: { r: 0.93, g: 0.76, b: 0.79 } },
    { id: 'bowMaterial', type: 'toonShadowMaterial', data: {} },
    { id: 'bowOut', type: 'sceneOutput', data: {} },
    { id: 'bowBackShade', type: 'shadeColor', data: { r: 0.93, g: 0.76, b: 0.79 } },
    { id: 'bowBackMaterial', type: 'toonShadowMaterial', data: {} },
    { id: 'bowBackOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    // 身頃+スカート
    { source: 'dressLength', sourceHandle: 'value', target: 'xProfile', targetHandle: 'length' },
    { source: 'dressLength', sourceHandle: 'value', target: 'depthProfile', targetHandle: 'length' },
    { source: 'dressLength', sourceHandle: 'value', target: 'offsetProfile', targetHandle: 'length' },
    { source: 'dressLength', sourceHandle: 'value', target: 'pleatProfile', targetHandle: 'length' },
    { source: 'dressLength', sourceHandle: 'value', target: 'tiltProfile', targetHandle: 'length' },
    { source: 'tiltProfile', sourceHandle: 'curve', target: 'dressGen', targetHandle: 'tiltProfile' },
    { source: 'xProfile', sourceHandle: 'curve', target: 'dressGen', targetHandle: 'profile' },
    { source: 'depthProfile', sourceHandle: 'curve', target: 'dressGen', targetHandle: 'depthProfile' },
    { source: 'offsetProfile', sourceHandle: 'curve', target: 'dressGen', targetHandle: 'offsetZProfile' },
    { source: 'pleatProfile', sourceHandle: 'curve', target: 'dressGen', targetHandle: 'pleatProfile' },

    // 肩ひも
    { source: 'strapWidth', sourceHandle: 'value', target: 'strapRingY', targetHandle: 'length' },
    { source: 'strapWidth', sourceHandle: 'value', target: 'strapRingZ', targetHandle: 'length' },
    { source: 'strapRingY', sourceHandle: 'curve', target: 'strapGen', targetHandle: 'profile' },
    { source: 'strapRingZ', sourceHandle: 'curve', target: 'strapGen', targetHandle: 'depthProfile' },
    { source: 'strapWidth', sourceHandle: 'value', target: 'strapHalfWidth', targetHandle: 'value' },
    { source: 'strapHalfWidth', sourceHandle: 'value', target: 'strapNegHalf', targetHandle: 'value' },
    { source: 'strapGen', sourceHandle: 'geometry', target: 'strapCenter', targetHandle: 'geometry' },
    { source: 'strapNegHalf', sourceHandle: 'value', target: 'strapCenter', targetHandle: 'y' },
    { source: 'strapCenter', sourceHandle: 'geometry', target: 'strapLay', targetHandle: 'geometry' },
    { source: 'strapLay', sourceHandle: 'geometry', target: 'strapRTilt', targetHandle: 'geometry' },
    { source: 'strapRTilt', sourceHandle: 'geometry', target: 'strapRTranslate', targetHandle: 'geometry' },
    { source: 'strapLay', sourceHandle: 'geometry', target: 'strapLTilt', targetHandle: 'geometry' },
    { source: 'strapLTilt', sourceHandle: 'geometry', target: 'strapLTranslate', targetHandle: 'geometry' },
    { source: 'strapLTranslate', sourceHandle: 'geometry', target: 'strapLMirror', targetHandle: 'geometry' },

    { source: 'dressGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'strapRTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'strapLMirror', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    ...output.edges,
    { source: 'placementY', sourceHandle: 'value', target: 'placement', targetHandle: 'y' },

    // リボン
    { source: 'bowWingLength', sourceHandle: 'value', target: 'bowWingWidth', targetHandle: 'length' },
    { source: 'bowWingLength', sourceHandle: 'value', target: 'bowWingDepth', targetHandle: 'length' },
    { source: 'bowWingWidth', sourceHandle: 'curve', target: 'bowWingGen', targetHandle: 'profile' },
    { source: 'bowWingDepth', sourceHandle: 'curve', target: 'bowWingGen', targetHandle: 'depthProfile' },
    { source: 'bowWingGen', sourceHandle: 'geometry', target: 'bowWingLay', targetHandle: 'geometry' },
    { source: 'bowWingLay', sourceHandle: 'geometry', target: 'bowWings', targetHandle: 'geometry' },
    { source: 'bowWings', sourceHandle: 'geometry', target: 'bowMerge', targetHandle: 'geometries' },
    { source: 'bowKnotGen', sourceHandle: 'geometry', target: 'bowKnotScale', targetHandle: 'geometry' },
    { source: 'bowKnotScale', sourceHandle: 'geometry', target: 'bowMerge', targetHandle: 'geometries' },
    { source: 'bowWingLay', sourceHandle: 'geometry', target: 'bowBackScale', targetHandle: 'geometry' },
    { source: 'bowBackScale', sourceHandle: 'geometry', target: 'bowBackShift', targetHandle: 'geometry' },
    { source: 'bowBackShift', sourceHandle: 'geometry', target: 'bowBackWings', targetHandle: 'geometry' },
    // 前の層と後ろの層を、同じ値で回して置く
    ...(
      [
        ['bowMerge', 'bowRoll', 'bowTurn', 'bowTranslate', 'bowPlacement', 'bowOut'],
        ['bowBackWings', 'bowBackRoll', 'bowBackTurn', 'bowBackTranslate', 'bowBackPlacement', 'bowBackOut'],
      ] as const
    ).flatMap(([source, roll, turn, move, place, out]) => [
      { source, sourceHandle: 'geometry', target: roll, targetHandle: 'geometry' },
      { source: 'bowRollZ', sourceHandle: 'value', target: roll, targetHandle: 'z' },
      { source: roll, sourceHandle: 'geometry', target: turn, targetHandle: 'geometry' },
      { source: 'bowTurnY', sourceHandle: 'value', target: turn, targetHandle: 'y' },
      { source: turn, sourceHandle: 'geometry', target: move, targetHandle: 'geometry' },
      { source: 'bowX', sourceHandle: 'value', target: move, targetHandle: 'x' },
      { source: 'bowY', sourceHandle: 'value', target: move, targetHandle: 'y' },
      { source: 'bowZ', sourceHandle: 'value', target: move, targetHandle: 'z' },
      { source: move, sourceHandle: 'geometry', target: place, targetHandle: 'geometry' },
      { source: 'placementY', sourceHandle: 'value', target: place, targetHandle: 'y' },
      { source: place, sourceHandle: 'geometry', target: out, targetHandle: 'geometry' },
    ]),
    { source: 'bowColor', sourceHandle: 'color', target: 'bowShade', targetHandle: 'color' },
    { source: 'bowColor', sourceHandle: 'color', target: 'bowMaterial', targetHandle: 'color' },
    { source: 'bowShade', sourceHandle: 'color', target: 'bowMaterial', targetHandle: 'shadowColor' },
    { source: 'bowMaterial', sourceHandle: 'material', target: 'bowOut', targetHandle: 'material' },
    { source: 'bowShade', sourceHandle: 'color', target: 'bowBackShade', targetHandle: 'color' },
    { source: 'bowShade', sourceHandle: 'color', target: 'bowBackMaterial', targetHandle: 'color' },
    { source: 'bowBackShade', sourceHandle: 'color', target: 'bowBackMaterial', targetHandle: 'shadowColor' },
    { source: 'bowBackMaterial', sourceHandle: 'material', target: 'bowBackOut', targetHandle: 'material' },
  ],
});
