import { defineGroupNode } from '../groupNodeFactory';
import { colorSocket, garmentOutput } from '../garmentOutput';

const output = garmentOutput({ y: 0.56, geometry: 'merge' });

/** キャミソールワンピース: 細い肩ひも・胸元がまっすぐでレースの縁(⋂⋂⋂)がある身頃・胸の下から裾へ広がる
 * プリーツのミニ丈のスカート・腰の脇の大きなリボン。
 *
 * - 身頃とスカート: 原点から胸元まで(`dressLength`)の1本の `loftGenerator` を、裾の高さの分だけ上へずらして(`dressShift`)置く。
 *   裾は参考画像の裾の縁の高さ(胸元の縁と同じ位置合わせで測った)に合わせてある。幅・前後の厚み・前後のずらしの3本の輪郭
 *   (`profileCurve17`/`signedProfileCurve17`、`radius` 1 なので値がそのまま長さ)は、胸元では体の断面より少し外、
 *   そこから裾へ台形に広がる値。胴体は後ろへ傾いているので、身頃の輪は上ほど後ろへずらす。
 *   胸元の縁の高さ(前で y 1.099)は、参考画像の肩ひもの足元(緑○)に合わせてある。後ろの上端は前より下がる(`topDrop*`)。
 *   後ろの上端の輪は `topDrop` で曲線を t≈0.89(r28〜r29)で評価するので、`depthProfile`/`offsetProfile` の r26〜r30 は、
 *   前面の位置(offset+depth)を保ったまま、背中側の位置が体の背中のすぐ外(+2mm 前後)に沿うよう決めてある(レースの帯が体から浮かず、
 *   すぐ下の面が体に沈まない)。
 *   胸元のレースは上端の輪を半円の山の形に持ち上げたもの(`scallopCount`/`scallopHeight`)で、服と地続き。
 *   プリーツの折り目は胸元の少し下から始まり、裾へ向かって深くなる(`pleatProfile`)。
 * - 肩ひも: 肩を一周する楕円の平たい帯。帯の外側の縁の輪を内側より小さくして(円錐の側面)肩の斜面に沿わせ、
 *   後ろへ傾けて肩に掛ける。下半分は身頃と体の中に隠れる。傾きと位置は左右で別々の値(`strapRTilt`/`strapRTranslate`、
 *   `strapLTilt`/`strapLTranslate`。左は右と同じ向きで作って `mirrorX` する)で、既定カメラ(斜め)で見た足元(服の縁の下へ
 *   隠れる位置)と上端(画面で一番高い点)の位置・傾きを参考画像に合わせてある。
 * - リボン: 別の色(`bowColor`)の2つ目の `sceneOutput`。結び目から外へ広がる羽2枚(付け根から先へ太くなり、
 *   先が丸く閉じる平たい `loftGenerator` を横に倒したもの、`mirrorPair`)と結び目。身頃の表面の向きに合わせて回し、
 *   腰の脇に置く。後ろの層の羽が身頃の表面に接する(身頃へ沈まない)位置で、既定カメラで見た位置は参考画像のまま
 *   (カメラの視線方向へ寄せてある)。身頃と同じ取り付け位置(`placementY`)だけ持ち上げる。 */
defineGroupNode({
  type: 'camisoleDressGroup',
  label: 'Camisole Dress',
  paletteSection: 'garment',
  internalNodes: [
    { id: 'input', type: 'groupInput', data: { sockets: [colorSocket('#f8f8f8')] } },

    // --- 身頃+スカート(原点から胸元まで 0.5137。裾は `dressShift` だけ上げてある) ---
    { id: 'dressLength', type: 'numberInput', data: { value: 0.5137 } },
    {
      id: 'xProfile',
      type: 'profileCurve33',
      data: { r0: 0.258118, r1: 0.250654, r2: 0.243177, r3: 0.235713, r4: 0.228222, r5: 0.220646, r6: 0.213091, r7: 0.205618, r8: 0.19815, r9: 0.19068, r10: 0.183121, r11: 0.175627, r12: 0.168159, r13: 0.160699, r14: 0.15316, r15: 0.14564, r16: 0.138259, r17: 0.133643, r18: 0.130546, r19: 0.127451, r20: 0.125415, r21: 0.124093, r22: 0.122243, r23: 0.122104, r24: 0.127456, r25: 0.133545, r26: 0.134931, r27: 0.133311, r28: 0.128342, r29: 0.129342, r30: 0.140858, r31: 0.146755, r32: 0.142261 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve33',
      data: { r0: 0.19976, r1: 0.193217, r2: 0.186642, r3: 0.180192, r4: 0.173643, r5: 0.167108, r6: 0.160565, r7: 0.154034, r8: 0.147585, r9: 0.141058, r10: 0.134514, r11: 0.127981, r12: 0.121425, r13: 0.114982, r14: 0.108403, r15: 0.10187, r16: 0.095502, r17: 0.09201, r18: 0.091514, r19: 0.09253, r20: 0.094055, r21: 0.095375, r22: 0.096435, r23: 0.098222, r24: 0.1005, r25: 0.099793, r26: 0.098352, r27: 0.09945, r28: 0.099249, r29: 0.101551, r30: 0.096882, r31: 0.092098, r32: 0.093855 },
    },
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve33',
      data: { r0: -0.001471, r1: -0.00241, r2: -0.00333, r3: -0.004303, r4: -0.005307, r5: -0.006256, r6: -0.007276, r7: -0.008212, r8: -0.009143, r9: -0.010078, r10: -0.011012, r11: -0.011946, r12: -0.012882, r13: -0.013808, r14: -0.014781, r15: -0.015877, r16: -0.016495, r17: -0.019276, r18: -0.023098, r19: -0.026377, r20: -0.030579, r21: -0.035885, r22: -0.041549, r23: -0.047558, r24: -0.053899, r25: -0.059121, r26: -0.064954, r27: -0.072735, r28: -0.079614, r29: -0.089762, r30: -0.093009, r31: -0.096475, r32: -0.105863 },
    },
    // 輪を前後へ傾ける角度(度)。上端は前から後ろへ下がり(負)、裾は前から後ろへ上がる(正)。
    {
      id: 'tiltProfile',
      type: 'signedProfileCurve33',
      data: { r0: 16.434724, r1: 15.441572, r2: 14.448333, r3: 13.455156, r4: 12.462019, r5: 11.468797, r6: 10.475581, r7: 9.482365, r8: 8.489154, r9: 7.495922, r10: 6.502802, r11: 5.509692, r12: 4.515926, r13: 3.525575, r14: 2.521531, r15: 1.564997, r16: 0.471678, r17: -0.042655, r18: -0.010172, r19: 0.010447, r20: -0.005326, r21: 0.002207, r22: -0.00082, r23: 0.000283, r24: -0.000093, r25: 0.000029, r26: -0.000009, r27: 0.000003, r28: -0.000001, r29: 0, r30: 0, r31: 0, r32: 0 },
    },
    {
      id: 'pleatProfile',
      type: 'signedProfileCurve33',
      data: { r0: 0.140007, r1: 0.139978, r2: 0.140066, r3: 0.139819, r4: 0.140438, r5: 0.139069, r6: 0.128448, r7: 0.114051, r8: 0.099928, r9: 0.086091, r10: 0.072571, r11: 0.059475, r12: 0.046894, r13: 0.034819, r14: 0.023384, r15: 0.012997, r16: 0.003518, r17: -0.000335, r18: -0.000062, r19: 0.000071, r20: -0.000037, r21: 0.000015, r22: -0.000006, r23: 0.000002, r24: -0.000001, r25: 0, r26: 0, r27: 0, r28: 0, r29: 0, r30: 0, r31: 0, r32: 0 },
    },
    {
      id: 'dressGen',
      type: 'loftGenerator',
      data: { steps: 72, segments: 336, pleatCount: 14, scallopCount: 48, scallopHeight: 0.006, topDropDepth: 0.057, topDropStart: 0.25, topDropEnd: 0.6729 },
    },
    // 輪郭は裾(原点)から胸元まで `dressLength` で作り、裾を上げた分だけ上へずらして胸元の高さを保つ。
    { id: 'dressShift', type: 'translate', data: { y: 0.0253 } },

    // --- 肩ひも(左右) ---
    // 肩を一周する楕円の平たい帯(幅 `strapWidth`)。Y 方向に帯の幅だけ伸ばした楕円の輪を横(X)へ倒し、後ろへ傾けて肩に掛ける。
    // 輪の半径の曲線は、`r0` が内側の縁、`r8` が外側の縁(段数が1なので両端だけが効く)。外側を小さくすると、肩が外へ下がる
    // 斜面に帯が沿う。幅・半径・傾き・位置は、見える部分が肌(と服の上端)のすぐ外(平均 3〜4mm、最大でも 6mm ほど)を通り、
    // 既定カメラで見た参考画像の細い肩ひもの足元・傾き・太さに近づくよう当てはめた値。左右で値が違うのは、斜めから見ると
    // カメラに近い右側ほど、後ろへ回る帯が大きく傾いて見えるため。下半分は体の中に隠れる。
    { id: 'strapWidth', type: 'numberInput', data: { value: 0.0123 } },
    { id: 'strapRingY', type: 'profileCurve', data: { radius: 0.120558, r0: 1, r1: 0.9908, r2: 0.9816, r3: 0.9724, r4: 0.9632, r5: 0.954, r6: 0.9449, r7: 0.9357, r8: 0.9265 } },
    { id: 'strapRingZ', type: 'profileCurve', data: { radius: 0.070359, r0: 1, r1: 0.9911, r2: 0.9822, r3: 0.9733, r4: 0.9644, r5: 0.9555, r6: 0.9466, r7: 0.9377, r8: 0.9287 } },
    { id: 'strapGen', type: 'loftGenerator', data: { steps: 1, segments: 96 } },
    { id: 'strapHalfWidth', type: 'numberHalf', data: {} },
    { id: 'strapNegHalf', type: 'numberNegate', data: {} },
    { id: 'strapCenter', type: 'translate', data: {} },
    { id: 'strapLay', type: 'rotate', data: { z: -90 } },
    { id: 'strapRTilt', type: 'rotate', data: { x: -27.520502, y: 0.876599, z: 7.994568 } },
    { id: 'strapRTranslate', type: 'translate', data: { x: 0.091014, y: 0.538768, z: -0.110492 } },
    { id: 'strapLTilt', type: 'rotate', data: { x: -26.078329, y: -3.79959, z: -12.32852 } },
    { id: 'strapLTranslate', type: 'translate', data: { x: 0.090763, y: 0.5186, z: -0.102705 } },
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
    // 前の層と後ろの層で同じ値を使う。位置は、後ろの層の羽が身頃に接し、右の腕に当たらない最大の寄せ量(視線方向)。
    { id: 'bowRollZ', type: 'numberInput', data: { value: 13 } },
    { id: 'bowTurnY', type: 'numberInput', data: { value: 38 } },
    { id: 'bowX', type: 'numberInput', data: { value: 0.1345 } },
    { id: 'bowY', type: 'numberInput', data: { value: 0.3469 } },
    { id: 'bowZ', type: 'numberInput', data: { value: 0.0473 } },
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

    { source: 'dressGen', sourceHandle: 'geometry', target: 'dressShift', targetHandle: 'geometry' },
    { source: 'dressShift', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
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
