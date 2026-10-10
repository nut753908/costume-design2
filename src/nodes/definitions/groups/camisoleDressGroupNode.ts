import { defineGroupNode } from '../groupNodeFactory';
import { colorSocket, garmentOutput } from '../garmentOutput';

const output = garmentOutput({ y: 0.56, geometry: 'merge' });

/** キャミソールワンピース: 細い肩ひも・胸元がまっすぐでレースの縁(⋂⋂⋂)がある身頃・胸の下から裾へ広がる
 * プリーツのミニ丈のスカート・腰の脇の大きなリボン。
 *
 * - 身頃とスカート: 裾(原点、股のすぐ下)から胸元までの1本の `loftGenerator`。幅・前後の厚み・前後のずらしの3本の輪郭
 *   (`profileCurve17`/`signedProfileCurve17`、`radius` 1 なので値がそのまま長さ)は、胸元では体の断面より少し外、
 *   そこから裾へ台形に広がる値。胴体は後ろへ傾いているので、身頃の輪は上ほど後ろへずらす。
 *   胸元のレースは上端の輪を半円の山の形に持ち上げたもの(`scallopCount`/`scallopHeight`)で、服と地続き。
 *   プリーツの折り目は胸元の少し下から始まり、裾へ向かって深くなる(`pleatProfile`)。
 * - 肩ひも: 肩を一周する細いトーラスを楕円に伸ばして後ろへ傾けたもの。下半分は身頃と体の中に隠れる。
 * - リボン: 別の色(`bowColor`)の2つ目の `sceneOutput`。結び目から外へ広がる羽2枚(付け根から先へ太くなり、
 *   先が丸く閉じる平たい `loftGenerator` を横に倒したもの、`mirrorPair`)と結び目。身頃の表面の向きに合わせて回し、
 *   腰の脇に置く。身頃と同じ取り付け位置(`placementY`)だけ持ち上げる。 */
defineGroupNode({
  type: 'camisoleDressGroup',
  label: 'Camisole Dress',
  paletteSection: 'garment',
  internalNodes: [
    { id: 'input', type: 'groupInput', data: { sockets: [colorSocket('#f8f8f8')] } },

    // --- 身頃+スカート(裾が原点、胸元まで 0.49) ---
    { id: 'dressLength', type: 'numberInput', data: { value: 0.49 } },
    {
      id: 'xProfile',
      type: 'profileCurve17',
      data: { r0: 0.27, r1: 0.2602, r2: 0.2504, r3: 0.2406, r4: 0.2308, r5: 0.221, r6: 0.2112, r7: 0.2014, r8: 0.1916, r9: 0.1818, r10: 0.172, r11: 0.166, r12: 0.155, r13: 0.138, r14: 0.1371, r15: 0.1373, r16: 0.1376 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve17',
      data: { r0: 0.21, r1: 0.2, r2: 0.19, r3: 0.18, r4: 0.17, r5: 0.16, r6: 0.15, r7: 0.14, r8: 0.13, r9: 0.12, r10: 0.11, r11: 0.106, r12: 0.106, r13: 0.1, r14: 0.0938, r15: 0.0922, r16: 0.0953 },
    },
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve17',
      data: { r0: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, r6: -0.003, r7: -0.005, r8: -0.008, r9: -0.013, r10: -0.022, r11: -0.03, r12: -0.037, r13: -0.05, r14: -0.0585, r15: -0.0755, r16: -0.0863 },
    },
    // 輪を前後へ傾ける角度(度)。上端は前から後ろへ下がり(負)、裾は前から後ろへ上がる(正)。
    {
      id: 'tiltProfile',
      type: 'signedProfileCurve17',
      data: { r0: 8, r1: 6.75, r2: 5.5, r3: 4.25, r4: 3, r5: 1.75, r6: 0.5, r7: -0.75, r8: -2, r9: -3.25, r10: -4.5, r11: -5.75, r12: -7, r13: -8.25, r14: -9.5, r15: -10.75, r16: -12 },
    },
    {
      id: 'pleatProfile',
      type: 'signedProfileCurve17',
      data: { r0: 0.14, r1: 0.137, r2: 0.134, r3: 0.13, r4: 0.126, r5: 0.122, r6: 0.118, r7: 0.113, r8: 0.108, r9: 0.1, r10: 0.09, r11: 0.075, r12: 0.05, r13: 0.025, r14: 0, r15: 0, r16: 0 },
    },
    {
      id: 'dressGen',
      type: 'loftGenerator',
      data: { steps: 48, segments: 336, pleatCount: 14, scallopCount: 48, scallopHeight: 0.006 },
    },

    // --- 肩ひも(左右) ---
    // 肩を一周する楕円の平たい帯(幅 `strapWidth`)。Y 方向に帯の幅だけ伸ばした楕円の輪を横(X)へ倒し、後ろへ傾けて肩に掛ける。
    // 楕円は、帯の幅の範囲の肩の断面(身頃より上)の外形に、肌のすぐ外を通るよう当てはめた値。下半分は体の中に隠れる。
    { id: 'strapWidth', type: 'numberInput', data: { value: 0.024 } },
    { id: 'strapRingY', type: 'profileCurve', data: { radius: 0.1444, r0: 1, r1: 1, r2: 1, r3: 1, r4: 1, r5: 1, r6: 1, r7: 1, r8: 1 } },
    { id: 'strapRingZ', type: 'profileCurve', data: { radius: 0.0727, r0: 1, r1: 1, r2: 1, r3: 1, r4: 1, r5: 1, r6: 1, r7: 1, r8: 1 } },
    { id: 'strapGen', type: 'loftGenerator', data: { steps: 1, segments: 96 } },
    { id: 'strapHalfWidth', type: 'numberHalf', data: {} },
    { id: 'strapNegHalf', type: 'numberNegate', data: {} },
    { id: 'strapCenter', type: 'translate', data: {} },
    { id: 'strapLay', type: 'rotate', data: { z: -90 } },
    { id: 'strapTilt', type: 'rotate', data: { x: -27.54 } },
    { id: 'strapTranslate', type: 'translate', data: { y: 0.5111, z: -0.0986 } },
    { id: 'strapPair', type: 'mirrorPair', data: { offset: 0.09 } },

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
    { id: 'bowWingWidth', type: 'profileCurve', data: { radius: 0.068, r0: 0.32, r1: 0.45, r2: 0.58, r3: 0.7, r4: 0.8, r5: 0.88, r6: 0.94, r7: 0.94, r8: 0 } },
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
    { id: 'bowRollZ', type: 'numberInput', data: { value: 7 } },
    { id: 'bowTurnY', type: 'numberInput', data: { value: 20 } },
    { id: 'bowX', type: 'numberInput', data: { value: 0.06 } },
    { id: 'bowY', type: 'numberInput', data: { value: 0.315 } },
    { id: 'bowZ', type: 'numberInput', data: { value: 0.095 } },
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
    { source: 'strapLay', sourceHandle: 'geometry', target: 'strapTilt', targetHandle: 'geometry' },
    { source: 'strapTilt', sourceHandle: 'geometry', target: 'strapTranslate', targetHandle: 'geometry' },
    { source: 'strapTranslate', sourceHandle: 'geometry', target: 'strapPair', targetHandle: 'geometry' },

    { source: 'dressGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'strapPair', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
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
